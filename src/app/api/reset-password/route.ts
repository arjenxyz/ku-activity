
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, isPhone } = await request.json();

    let resetEmail = email;
    if (isPhone) {
      const cleanPhone = email.replace(/\D/g, '');
      resetEmail = `${cleanPhone}@arjendev.com`;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${request.nextUrl.origin}/admin/pass-reset`
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Şifre sıfırlama bağlantısı gönderildi' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
