// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from '@/utils/supabase/middleware'; 

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/admin-panel/login" || pathname === "/personnel-panel/login") {
    return response; 
  }

  if (pathname.startsWith("/admin-panel")) {
    const adminCookie = request.cookies.get("admin_session");
    if (!adminCookie) { 
      console.log('Middleware: Admin session yok, /admin-panel/login adresine yönlendiriliyor.');
      return NextResponse.redirect(new URL("/admin-panel/login", request.url));
    }
  }

  if (pathname.startsWith("/personnel-panel")) {
    const personnelCookie = request.cookies.get("personnel_session");
    if (!personnelCookie) { 
      console.log('Middleware: Personnel session yok, /personnel-panel/login adresine yönlendiriliyor.');
      return NextResponse.redirect(new URL("/personnel-panel/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
