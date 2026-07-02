import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, getSupabaseMiddlewareClient } from '@/utils/supabase/middleware';
import { PERSONNEL_COOKIE } from '@/lib/personnel-cookie';
import { PENDING_REGISTRATION_COOKIE } from '@/lib/registration-pending-storage';

const ADMIN_LOGIN = '/admin-panel/login';
const ADMIN_REGISTER = '/admin-panel/register';
const PERSONNEL_LOGIN = '/personnel-panel/login';
const PERSONNEL_BASVURU = '/personnel-panel/basvuru';
const PERSONNEL_SIFREMI_UNUTTUM = '/personnel-panel/sifremi-unuttum';
const DEVELOPER_LOGIN = '/developer-panel/login';

function isPersonnelPublicPath(pathname: string): boolean {
  if (pathname === PERSONNEL_LOGIN) return true;
  if (pathname === PERSONNEL_SIFREMI_UNUTTUM) return true;
  if (pathname === PERSONNEL_BASVURU || pathname.startsWith(`${PERSONNEL_BASVURU}/`)) {
    return true;
  }
  return false;
}

function shouldRefreshSupabaseSession(pathname: string) {
  if (pathname.startsWith('/api/public')) return false;
  if (pathname.startsWith('/api/auth/personnel')) return false;
  if (pathname.startsWith('/sozlesme')) return false;
  if (isPersonnelPublicPath(pathname)) return false;
  if (pathname === ADMIN_LOGIN || pathname === ADMIN_REGISTER) return false;
  if (pathname === DEVELOPER_LOGIN) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = shouldRefreshSupabaseSession(pathname)
    ? await updateSession(request)
    : NextResponse.next({ request: { headers: request.headers } });

  const isAdminLogin = pathname === ADMIN_LOGIN;
  const isAdminRegister = pathname === ADMIN_REGISTER;
  const isAdminPublic = isAdminLogin || isAdminRegister;
  const isPersonnelPublic = isPersonnelPublicPath(pathname);
  const isDeveloperLogin = pathname === DEVELOPER_LOGIN;
  const isAdminRoute = pathname.startsWith('/admin-panel') && !isAdminPublic;
  const isDeveloperRoute = pathname.startsWith('/developer-panel') && !isDeveloperLogin;
  const isPersonnelRoute =
    pathname.startsWith('/personnel-panel') && !isPersonnelPublic;

  if (isDeveloperRoute || isDeveloperLogin) {
    const supabase = await getSupabaseMiddlewareClient(request);
    if (!supabase) return response;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: isDeveloper } = await supabase.rpc('is_developer');
      if (isDeveloper && isDeveloperLogin) {
        return NextResponse.redirect(new URL('/developer-panel', request.url));
      }
      if (isDeveloperRoute && !isDeveloper) {
        const url = new URL(DEVELOPER_LOGIN, request.url);
        url.searchParams.set('error', 'yetkisiz');
        return NextResponse.redirect(url);
      }
    } else if (isDeveloperRoute) {
      return NextResponse.redirect(new URL(DEVELOPER_LOGIN, request.url));
    }
  }

  if (isAdminRoute || isAdminPublic) {
    const supabase = await getSupabaseMiddlewareClient(request);
    if (!supabase) return response;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin && (isAdminLogin || isAdminRegister)) {
        return NextResponse.redirect(new URL('/admin-panel', request.url));
      }
      if (isAdminRoute && !isAdmin) {
        const url = new URL(ADMIN_LOGIN, request.url);
        url.searchParams.set('error', 'yetkisiz');
        return NextResponse.redirect(url);
      }
    } else if (isAdminRoute) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
  }

  const hasPersonnelCookie = Boolean(request.cookies.get(PERSONNEL_COOKIE)?.value);
  const hasPendingApplicationCookie =
    request.cookies.get(PENDING_REGISTRATION_COOKIE)?.value === '1';

  if (hasPersonnelCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/personnel-panel', request.url));
  }

  if (
    !hasPersonnelCookie &&
    hasPendingApplicationCookie &&
    (pathname === PERSONNEL_LOGIN || isPersonnelRoute)
  ) {
    return NextResponse.redirect(new URL(PERSONNEL_BASVURU, request.url));
  }

  if (isPersonnelRoute || pathname === PERSONNEL_LOGIN) {
    if (hasPersonnelCookie && pathname === PERSONNEL_LOGIN) {
      return NextResponse.redirect(new URL('/personnel-panel', request.url));
    }
    if (!hasPersonnelCookie && isPersonnelRoute) {
      return NextResponse.redirect(new URL(PERSONNEL_LOGIN, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|manifest-personnel.webmanifest|manifest-admin.webmanifest|\\.well-known|icons/|api/pwa-icon|api/twa|gizlilik|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
};
