import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isStaffRole } from '@/lib/roles';

const CUSTOMER_PROTECTED = ['/account', '/wishlist'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth'];

/** Canonical host (no www). Matches NEXT_PUBLIC_SITE_URL / live domain. */
const CANONICAL_HOST = (() => {
  try {
    return new URL(
      (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gamemaniaauk.co.uk').trim(),
    ).hostname.toLowerCase();
  } catch {
    return 'gamemaniaauk.co.uk';
  }
})();

function requestHost(request: NextRequest): string {
  const raw =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    '';
  return raw.toLowerCase().replace(/:\d+$/, '');
}

/** 301 www → apex so Google consolidates to one host. */
function redirectWwwToApex(request: NextRequest): NextResponse | null {
  const host = requestHost(request);
  if (!host || host === CANONICAL_HOST || host === 'localhost' || host.endsWith('.localhost')) {
    return null;
  }
  const apex = CANONICAL_HOST.replace(/^www\./, '');
  if (host !== `www.${apex}`) return null;

  const target = new URL(request.url);
  target.protocol = 'https:';
  target.hostname = apex;
  target.port = '';
  return NextResponse.redirect(target, 301);
}

function isCustomerProtected(pathname: string): boolean {
  return CUSTOMER_PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const wwwRedirect = redirectWwwToApex(request);
  if (wwwRedirect) return wwwRedirect;

  const { pathname, search } = request.nextUrl;
  const loggedIn = request.cookies.get('gm_logged_in')?.value === '1';
  const role = request.cookies.get('gm_role')?.value ?? '';
  const staff = isStaffRole(role);

  // Staff accounts stay inside /admin only (no storefront shopping UX)
  if (loggedIn && staff && !isAdminPath(pathname) && !isAuthPath(pathname)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin';
    adminUrl.search = '';
    return NextResponse.redirect(adminUrl);
  }

  if (isAdminPath(pathname)) {
    if (!loggedIn) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('returnUrl', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!staff) {
      const accountUrl = request.nextUrl.clone();
      accountUrl.pathname = '/account';
      accountUrl.search = '';
      return NextResponse.redirect(accountUrl);
    }
    return NextResponse.next();
  }

  if (!isCustomerProtected(pathname)) {
    return NextResponse.next();
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('returnUrl', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Run on app routes (incl. www→apex). Skip Next internals and static files.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
