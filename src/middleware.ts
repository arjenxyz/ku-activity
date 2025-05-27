import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin login sayfası izinli
  if (pathname === "/admin-panel/login") {
    return NextResponse.next();
  }

  // Personel login sayfası izinli
  if (pathname === "/personnel-panel/login") {
    return NextResponse.next();
  }

  // Admin panel yolları kontrolü
  if (pathname.startsWith("/admin-panel")) {
    const adminCookie = request.cookies.get("admin_session");
    if (!adminCookie) {
      return NextResponse.redirect(new URL("/admin-panel/login", request.url));
    }
  }

  // Personel panel yolları kontrolü
  if (pathname.startsWith("/personnel-panel")) {
    const personnelCookie = request.cookies.get("personnel_session");
    if (!personnelCookie) {
      return NextResponse.redirect(new URL("/personnel-panel/login", request.url));
    }
  }

  // Diğer istekler serbest
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-panel/:path*", "/personnel-panel/:path*"],
};
