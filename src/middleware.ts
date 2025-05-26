import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Eğer istek admin-panel/login sayfası ise, yönlendirme yapma!
  if (pathname === "/admin-panel/login") {
    return NextResponse.next();
  }

  // Admin panel yollarını kontrol et
  if (pathname.startsWith("/admin-panel")) {
    const cookie = request.cookies.get("admin_session");
    if (!cookie) {
      // Giriş yoksa admin login sayfasına yolla
      return NextResponse.redirect(new URL("/admin-panel/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-panel/:path*"]
};
