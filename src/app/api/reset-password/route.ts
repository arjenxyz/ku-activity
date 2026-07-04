
/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/auth';
import strings from '@json/src/app/api/reset-password/route.json';

export async function POST(request: NextRequest) {
  try {
    const { email, isPhone } = await request.json();

    let resetEmail = email;
    if (isPhone) {
      const cleanPhone = email.replace(/\D/g, '');
      resetEmail = `${cleanPhone}@crewledger.app`;
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
      { message: strings.şifreSıfırlamaBağlantısıGönderildi },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: strings.birHataOluştu },
      { status: 500 }
    );
  }
}
