import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

function keyByUserOrIp(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return `user:${auth.slice(7, 30)}`;
  }
  return `ip:${req.ip}`;
}

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  keyGenerator: keyByUserOrIp,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/refresh',
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: keyByUserOrIp,
  message: { success: false, message: 'AI rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: keyByUserOrIp,
  message: { success: false, message: 'Upload rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});
