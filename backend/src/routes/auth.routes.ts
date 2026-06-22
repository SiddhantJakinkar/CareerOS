import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
  getCsrf,
  verifyEmail,
  resendVerification,
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactor,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
  verifyEmailSchema,
  twoFactorEnableSchema,
  twoFactorVerifySchema,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { csrfProtection } from '../middleware/csrf.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/csrf', getCsrf);
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);
router.post('/refresh', csrfProtection, validate(refreshSchema), refresh);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/2fa/verify', authLimiter, validate(twoFactorVerifySchema), verifyTwoFactor);
router.post('/logout', csrfProtection, authenticate, logout);
router.post('/verify-email/resend', authenticate, resendVerification);
router.post('/2fa/setup', authenticate, setupTwoFactor);
router.post('/2fa/enable', authenticate, validate(twoFactorEnableSchema), enableTwoFactor);
router.get('/me', authenticate, getMe);

export default router;
