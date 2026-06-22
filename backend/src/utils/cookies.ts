import crypto from 'crypto';
import type { Response, Request } from 'express';
import { env } from '../config/env.js';

export const REFRESH_COOKIE = 'refresh_token';
export const CSRF_COOKIE = 'csrf_token';

const cookieBase = {
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase,
    httpOnly: true,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function setCsrfCookie(res: Response, csrfToken: string): void {
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...cookieBase,
    httpOnly: false,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function setAuthCookies(res: Response, refreshToken: string, csrfToken: string): void {
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res, csrfToken);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE] as string | undefined;
}
