import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Unauthorized', 401));
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    req.user = verifyAccessToken(authHeader.split(' ')[1]);
  } catch {
    // Public job search still works without auth
  }
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }
    next();
  };
}

export function requireOwnership(resourceUserId: string, requestUserId: string): void {
  if (resourceUserId !== requestUserId) {
    throw new AppError('Forbidden', 403);
  }
}
