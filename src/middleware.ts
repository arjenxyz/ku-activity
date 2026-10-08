import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, getSupabaseMiddlewareClient } from '@/utils/supabase/middleware';
import { homePathForRole, isAppRole, type AppRole } from '@/lib/auth/roles';
import { DEMO_COOKIE, parseDemoRole } from '@/lib/demo/session';

const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/gizlilik',
  '/kvkk',
  '/kullanim-sartlari',
  '/forum',
  '/etkinlikler',
  '/ekip',
  '/api/public',
  '/api/session',
  '/api/demo',
];

function isPublicPath(pathname: string) {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

async function getRole(request: NextRequest): Promise<AppRole | null> {
  const demoRole = parseDemoRole(request.cookies.get(DEMO_COOKIE)?.value);
  if (demoRole) return demoRole;

  const supabase = await getSupabaseMiddlewareClient(request);
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).maybeSingle();
  if (!data?.is_active || !isAppRole(data.role)) return null;
  return data.role;
}

function studentLegacyRedirect(pathname: string, request: NextRequest) {
  if (pathname.startsWith('/student/registrations')) {
    return NextResponse.redirect(new URL('/kayitlarim', request.url));
  }
  if (pathname.startsWith('/student/qr')) {
    return NextResponse.redirect(new URL('/qr', request.url));
  }
  return NextResponse.redirect(new URL('/etkinlikler', request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await updateSession(request);

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/pwa-icon') ||
    pathname.startsWith('/api/twa') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Old student panel routes → public site surfaces
  if (pathname.startsWith('/student')) {
    return studentLegacyRedirect(pathname, request);
  }

  const role = await getRole(request);
  const isAuthed = Boolean(role);

  if (pathname === '/login') {
    if (isAuthed && role) {
      return NextResponse.redirect(new URL(homePathForRole(role), request.url));
    }
    return response;
  }

  if (isPublicPath(pathname)) {
    return response;
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'admin') {
      return NextResponse.redirect(new URL(homePathForRole(role!), request.url));
    }
    return response;
  }

  if (pathname.startsWith('/staff')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.redirect(new URL(homePathForRole(role!), request.url));
    }
    return response;
  }

  // Student-only surfaces on the public site
  if (pathname.startsWith('/kayitlarim') || pathname.startsWith('/qr')) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'student' && role !== 'admin') {
      return NextResponse.redirect(new URL(homePathForRole(role!), request.url));
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
