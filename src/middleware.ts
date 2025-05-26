import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Admin panel yollarını kontrol et
  if (request.nextUrl.pathname.startsWith("/admin-panel")) {
    const cookie = request.cookies.get("admin_session");
    if (!cookie) {
      // Giriş yoksa admin login sayfasına yolla
      return NextResponse.redirect(new URL("/admin-panel/login", request.url));
    }
  }
  return NextResponse.next();
}

// Hangi sayfalarda çalışacak?
export const config = {
  matcher: ["/admin-panel/:path*"]
};