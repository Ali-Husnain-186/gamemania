const LOGGED_IN_COOKIE = 'gm_logged_in';
const ROLE_COOKIE = 'gm_role';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function setLoggedInCookie(role?: string | null): void {
  writeCookie(LOGGED_IN_COOKIE, '1', MAX_AGE_SECONDS);
  if (role) {
    writeCookie(ROLE_COOKIE, role.toUpperCase(), MAX_AGE_SECONDS);
  } else {
    // Avoid stale staff role from a previous session
    writeCookie(ROLE_COOKIE, '', 0);
  }
}

export function clearLoggedInCookie(): void {
  writeCookie(LOGGED_IN_COOKIE, '', 0);
  writeCookie(ROLE_COOKIE, '', 0);
}

export { LOGGED_IN_COOKIE, ROLE_COOKIE };
