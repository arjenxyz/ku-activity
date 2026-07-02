import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { validateIdentityNumber } from '@/lib/field-encryption';
import { findEmployeeForIdentityLogin } from '@/lib/personnel-login';
import { hasPendingRegistrationForIdentity } from '@/lib/registration-service';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import {
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  personnelCookieOptions,
  PERSONNEL_COOKIE,
} from '@/lib/personnel-session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identityType, identityNumber, tcKimlik, password } = body as {
      identityType?: 'tc' | 'foreign';
      identityNumber?: string;
      tcKimlik?: string;
      password?: string;
    };

    const normalizedType = identityType === 'foreign' ? 'foreign' : 'tc';
    const loginIdentity = (identityNumber ?? tcKimlik ?? '').trim();

    if (!loginIdentity || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Kimlik numarası ve şifre gerekli' }, { status: 400 });
    }

    if (!validateIdentityNumber(normalizedType, loginIdentity)) {
      return NextResponse.json({ error: 'Geçersiz kimlik numarası veya şifre' }, { status: 401 });
    }

    const pinError = validatePersonnelPin(password);
    if (pinError) {
      return NextResponse.json({ error: 'Geçersiz kimlik numarası veya şifre' }, { status: 401 });
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

    if (!process.env.FIELD_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: 'Sunucu yapılandırması eksik: FIELD_ENCRYPTION_KEY tanımlı değil' },
        { status: 503 }
      );
    }

    const admin = createAdminClient();

    const pending = await hasPendingRegistrationForIdentity(normalizedType, loginIdentity);
    if (pending) {
      return NextResponse.json(
        {
          error:
            'Başvurunuz henüz onaylanmadı. Başvuru ekranından kimlik ve PIN ile durumunuzu görüntüleyin.',
        },
        { status: 403 }
      );
    }

    const employee = await findEmployeeForIdentityLogin(admin, normalizedType, loginIdentity);

    if (!employee) {
      return NextResponse.json({ error: 'Geçersiz kimlik numarası veya şifre' }, { status: 401 });
    }

    if (!employee.is_active) {
      return NextResponse.json(
        { error: 'Personel hesabınız pasif. Yöneticinizle iletişime geçin.' },
        { status: 403 }
      );
    }

    if (!employee.pin_hash) {
      return NextResponse.json(
        { error: 'Personel şifresi tanımlı değil. Yöneticinizle iletişime geçin.' },
        { status: 403 }
      );
    }

    const pin = password.trim();

    let valid = false;
    try {
      valid = await bcrypt.compare(pin, employee.pin_hash);
    } catch {
      return NextResponse.json(
        { error: 'Personel şifre kaydı bozuk. Yönetici panelinden şifreyi yenileyin.' },
        { status: 500 }
      );
    }

    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz kimlik numarası veya şifre' }, { status: 401 });
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
