import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function generateTwoFactorToken(userId: string): string {
  return jwt.sign({ userId, purpose: '2fa' }, env.JWT_SECRET, { expiresIn: '5m' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function verifyTwoFactorToken(token: string): { userId: string } {
  const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose?: string };
  if (payload.purpose !== '2fa') {
    throw new Error('Invalid two-factor token');
  }
  return { userId: payload.userId };
}
