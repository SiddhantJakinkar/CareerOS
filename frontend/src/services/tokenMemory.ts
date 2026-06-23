const ACCESS_KEY = 'careeros_access_token';
const CSRF_KEY = 'careeros_csrf_token';

let accessToken: string | null = null;
let csrfToken: string | null = null;

function readSession(key: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // private browsing / blocked storage
  }
}

function restoreFromSession(): void {
  accessToken = readSession(ACCESS_KEY);
  csrfToken = readSession(CSRF_KEY);
}

restoreFromSession();

export function setAccessToken(token: string | null): void {
  accessToken = token;
  writeSession(ACCESS_KEY, token);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
  writeSession(CSRF_KEY, token);
}

export function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearTokens(): void {
  accessToken = null;
  csrfToken = null;
  writeSession(ACCESS_KEY, null);
  writeSession(CSRF_KEY, null);
}
