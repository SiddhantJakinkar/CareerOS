import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  getMe,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
