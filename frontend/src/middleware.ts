import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isStaffRole } from '@/lib/roles';

const CUSTOMER_PROTECTED = ['/account', '/wishlist', '/checkout'];
const AUTH_PATHS = ['/login', '/register', '/auth'];

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
    '/',
    '/shop',
    '/shop/:path*',
    '/products/:path*',
    '/cart',
    '/checkout',
    '/account',
    '/account/:path*',
    '/wishlist',
    '/trade-in',
    '/about',
    '/contact',
    '/faq',
    '/login',
    '/register',
    '/auth/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
