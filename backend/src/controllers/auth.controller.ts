import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { hashPassword, comparePassword, PASSWORD_REGEX } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

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
  refreshToken: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed });
    await Profile.create({ userId: user._id });

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User registered', { userId: user._id });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, onboardingCompleted: false },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.isLocked) {
      throw new AppError('Account locked. Try again in 15 minutes.', 429);
    }

    if (!user.password) {
      throw new AppError('Please sign in with Google', 400);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await user.save();
      throw new AppError('Invalid credentials', 401);
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google OAuth not configured', 503);
    }

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new AppError('Invalid Google token', 401);
    }

    let user = await User.findOne({ email: payload.email }).select('+refreshToken');

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
      await user.save();
    }

    const tokenPayload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
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

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, { $unset: { refreshToken: 1 } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
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
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        },
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}
