import crypto from 'crypto';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { User, type IUser } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { hashPassword, comparePassword, PASSWORD_REGEX } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTwoFactorToken,
  verifyRefreshToken,
  verifyTwoFactorToken,
} from '../utils/jwt.js';
import {
  clearAuthCookies,
  generateCsrfToken,
  getRefreshTokenFromRequest,
  setAuthCookies,
  setCsrfCookie,
  CSRF_COOKIE,
} from '../utils/cookies.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { auditFromRequest } from '../services/audit.service.js';
import { sendVerificationEmail } from '../services/email.service.js';

const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const PRIVILEGED_ROLES = new Set(['admin', 'counselor']);

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().regex(PASSWORD_REGEX, 'Password must be 8+ chars with upper, lower, number, special'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const twoFactorVerifySchema = z.object({
  twoFactorToken: z.string().min(1),
  code: z.string().length(6),
});

export const twoFactorEnableSchema = z.object({
  code: z.string().length(6),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

function serializeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
    isEmailVerified: user.isEmailVerified,
    totpEnabled: user.totpEnabled,
  };
}

async function createEmailVerification(user: IUser): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendVerificationEmail(user.email, token);
}

async function issueSession(
  req: Request,
  res: Response,
  user: IUser,
  skipTwoFactor = false
): Promise<void> {
  if (
    !skipTwoFactor &&
    PRIVILEGED_ROLES.has(user.role) &&
    user.totpEnabled
  ) {
    res.json({
      success: true,
      data: {
        requiresTwoFactor: true,
        twoFactorToken: generateTwoFactorToken(user._id.toString()),
        user: serializeUser(user),
      },
    });
    return;
  }

  const payload = { userId: user._id.toString(), email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshToken = refreshToken;
  await user.save();

  const csrfToken = generateCsrfToken();
  setAuthCookies(res, refreshToken, csrfToken);

  await auditFromRequest(req, {
    action: 'auth.session_created',
    resource: 'user',
    resourceId: user._id.toString(),
    severity: 'info',
  });

  res.json({
    success: true,
    data: {
      user: serializeUser(user),
      accessToken,
      csrfToken,
    },
  });
}

export async function getCsrf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let csrfToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      setCsrfCookie(res, csrfToken);
    }
    res.json({ success: true, data: { csrfToken } });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already registered', 400);

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed });
    await Profile.create({ userId: user._id });
    await createEmailVerification(user);

    logger.info('User registered', { userId: user._id });
    await auditFromRequest(req, {
      action: 'auth.register',
      resource: 'user',
      resourceId: user._id.toString(),
    });

    await issueSession(req, res, user, true);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken +totpSecret');

    if (!user) throw new AppError('Invalid credentials', 401);
    if (user.isLocked) throw new AppError('Account locked. Try again in 15 minutes.', 429);
    if (!user.password) throw new AppError('Please sign in with Google', 400);

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
      await auditFromRequest(req, {
        action: 'auth.login_failed',
        resource: 'user',
        resourceId: user._id.toString(),
        severity: 'warn',
      });
      throw new AppError('Invalid credentials', 401);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    await issueSession(req, res, user);
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.GOOGLE_CLIENT_ID) throw new AppError('Google OAuth not configured', 503);

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError('Invalid Google token', 401);

    let user = await User.findOne({ email: payload.email }).select('+refreshToken +totpSecret');

    if (!user) {
      user = await User.create({
        name: payload.name ?? payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        isEmailVerified: payload.email_verified ?? false,
      });
      await Profile.create({ userId: user._id });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (payload.email_verified) user.isEmailVerified = true;
      await user.save();
    }

    await issueSession(req, res, user);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = getRefreshTokenFromRequest(req) ?? req.body.refreshToken;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    user.refreshToken = newRefreshToken;
    await user.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, newRefreshToken, csrfToken);

    res.json({ success: true, data: { accessToken, csrfToken } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, { $unset: { refreshToken: 1 } });
      await auditFromRequest(req, {
        action: 'auth.logout',
        resource: 'user',
        resourceId: req.user.userId,
      });
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) throw new AppError('Invalid or expired verification link', 400);

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.isEmailVerified) throw new AppError('Email already verified', 400);

    await createEmailVerification(user);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
}

export async function setupTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId).select('+totpSecret');
    if (!user) throw new AppError('User not found', 404);
    if (!PRIVILEGED_ROLES.has(user.role)) {
      throw new AppError('2FA is only available for admin and counselor accounts', 403);
    }

    const secret = generateSecret();
    user.totpSecret = secret;
    user.totpEnabled = false;
    await user.save();

    const otpauthUrl = generateURI({
      issuer: 'CareerOS',
      label: user.email,
      secret,
    });
    res.json({
      success: true,
      data: { secret, otpauthUrl },
    });
  } catch (error) {
    next(error);
  }
}

export async function enableTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user!.userId).select('+totpSecret');
    if (!user?.totpSecret) throw new AppError('Run 2FA setup first', 400);

    const result = verifySync({ token: code, secret: user.totpSecret });
    if (!result.valid) throw new AppError('Invalid authenticator code', 400);

    user.totpEnabled = true;
    await user.save();

    await auditFromRequest(req, {
      action: 'auth.2fa_enabled',
      resource: 'user',
      resourceId: user._id.toString(),
      severity: 'info',
    });

    res.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    next(error);
  }
}

export async function verifyTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { twoFactorToken, code } = req.body;
    const { userId } = verifyTwoFactorToken(twoFactorToken);
    const user = await User.findById(userId).select('+totpSecret +refreshToken');
    if (!user?.totpSecret || !user.totpEnabled) {
      throw new AppError('Two-factor authentication not configured', 400);
    }

    const result = verifySync({ token: code, secret: user.totpSecret });
    if (!result.valid) {
      await auditFromRequest(req, {
        action: 'auth.2fa_failed',
        resource: 'user',
        resourceId: userId,
        severity: 'warn',
      });
      throw new AppError('Invalid authenticator code', 401);
    }

    await issueSession(req, res, user, true);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new AppError('User not found', 404);

    const profile = await Profile.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}
