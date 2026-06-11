import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  personnelCookieOptions,
  PERSONNEL_COOKIE,
} from '@/lib/personnel-session';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type LoginEmployee = {
  id: string;
  project_id: string;
  pin_hash: string;
  is_active: boolean;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 });
    }

    if (password.length < 4 || password.length > 64) {
      return NextResponse.json({ error: 'Geçersiz şifre' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Sunucu yapılandırması eksik: .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin (Supabase → Settings → API → service_role)',
        },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const normalized = normalizeEmail(email);
    let employee: LoginEmployee | null = null;

    const { data: rpcRows, error: rpcError } = await admin.rpc('get_employee_for_login', {
      p_email: normalized,
    });

    if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
      employee = rpcRows[0] as LoginEmployee;
    } else {
      if (rpcError) {
        console.warn('get_employee_for_login RPC:', rpcError.message);
      }
      const { data, error } = await admin
        .from('employees')
        .select('id, project_id, pin_hash, is_active')
        .ilike('email', normalized)
        .maybeSingle();

      if (!error && data) {
        employee = data as LoginEmployee;
      }
    }

    if (!employee || !employee.is_active) {
      return NextResponse.json({ error: 'Geçersiz e-posta veya şifre' }, { status: 401 });
    }

    if (!employee.pin_hash) {
      return NextResponse.json(
        { error: 'Personel şifresi tanımlı değil. Yöneticinizle iletişime geçin.' },
        { status: 403 }
      );
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, employee.pin_hash);
    } catch {
      return NextResponse.json(
        { error: 'Personel şifre kaydı bozuk. Yönetici panelinden şifreyi yenileyin.' },
        { status: 500 }
      );
    }

    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz e-posta veya şifre' }, { status: 401 });
    }

    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    const { error: sessionError } = await admin.from('personnel_sessions').insert({
      employee_id: employee.id,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error('Oturum oluşturma hatası:', sessionError);
      const hint =
        sessionError.message.includes('personnel_sessions') ||
        sessionError.code === '42P01'
          ? '001_initial_schema.sql içindeki personnel_sessions tablosunu çalıştırın.'
          : sessionError.message;
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? `Oturum oluşturulamadı: ${hint}`
              : 'Oturum oluşturulamadı. Veritabanı kurulumunu kontrol edin.',
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(PERSONNEL_COOKIE, token, personnelCookieOptions(expiresAt));
    return response;
  } catch (err) {
    console.error('Personel giriş hatası:', err);
    const message =
      err instanceof Error && err.message.includes('SERVICE_ROLE')
        ? 'SUPABASE_SERVICE_ROLE_KEY .env dosyasında tanımlı değil.'
        : 'Beklenmeyen sunucu hatası. Konsol loglarını kontrol edin.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
