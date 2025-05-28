// src/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr'; // alternatif olarak bunu tanımlayabiliriz

export async function updateSession(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove: (name: string, options: CookieOptions) => {
            const expiredCookie = { name, value: '', ...options, expires: new Date(0) };
            request.cookies.set(expiredCookie);
            response.cookies.set(expiredCookie);
          },
        },
      }
    );

    await supabase.auth.getUser();

    return response;
  } catch (e) {
    console.error('Error in updateSession middleware:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}
