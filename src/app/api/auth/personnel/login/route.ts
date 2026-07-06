import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { validateIdentityNumber } from '@/lib/field-encryption';
import { findEmployeeForIdentityLogin } from '@/lib/personnel-login';
import { verifyPendingRegistrationAccess } from '@/lib/registration-service';
import {
  PENDING_REGISTRATION_COOKIE,
  pendingRegistrationCookieOptions,
} from '@/lib/registration-pending-storage';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import strings from '@json/src/app/api/auth/personnel/login/route.json';
import { formatString } from '@/lib/strings/format';
import {
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  personnelCookieOptions,
  PERSONNEL_COOKIE,
} from '@/lib/personnel-session';
import { createPersonnelSession } from '@/lib/personnel-session-service';

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
      return NextResponse.json({ error: strings.kimlikNumarasıVeŞifreGerekli }, { status: 400 });
    }

    if (!validateIdentityNumber(normalizedType, loginIdentity)) {
      return NextResponse.json({ error: strings.geçersizKimlikNumarasıVeyaŞifre }, { status: 401 });
    }

    const pinError = validatePersonnelPin(password);
    if (pinError) {
      return NextResponse.json({ error: strings.geçersizKimlikNumarasıVeyaŞifre }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: strings.sunucuYapılandırmasıEksikEnvDosyasınaSupabase,
        },
        { status: 503 }
      );
    }

    if (!process.env.FIELD_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: strings.sunucuYapılandırmasıEksikFieldEncryptionKey },
        { status: 503 }
      );
    }

    const admin = createAdminClient();

    let employee = await findEmployeeForIdentityLogin(admin, normalizedType, loginIdentity);

    if (employee) {
      const { maybePurgeAcceleratedEmployee } = await import('@/lib/employee-closure-purge');
      const purged = await maybePurgeAcceleratedEmployee(employee.project_id, employee.id);
      if (purged) employee = null;
    }

    if (!employee) {
      console.warn('Personel giriş: kimlik ile kayıt bulunamadı', {
        identityType: normalizedType,
        identityTail: loginIdentity.slice(-4),
      });

      const pendingAccess = await verifyPendingRegistrationAccess({
        identityType: normalizedType,
        identityNumber: loginIdentity,
        pin: password,
      });

      if (pendingAccess === 'expired') {
        return NextResponse.json(
          { error: strings.başvuruSüresiDolmuşYeniBaşvuruYapabilirsiniz },
          { status: 410 }
        );
      }

      if (pendingAccess) {
        const response = NextResponse.json({
          pending: true,
          verificationCode: pendingAccess.verificationCode,
          approvalUrl: pendingAccess.approvalUrl,
          identityType: pendingAccess.identityType,
          identityNumber: pendingAccess.identityNumber,
          tcKimlik: pendingAccess.tcKimlik,
        });
        response.cookies.set(
          PENDING_REGISTRATION_COOKIE,
          pendingAccess.verificationCode,
          pendingRegistrationCookieOptions(true)
        );
        return response;
      }

      return NextResponse.json({ error: strings.geçersizKimlikNumarasıVeyaŞifre }, { status: 401 });
    }

    if (!employee.is_active) {
      return NextResponse.json(
        { error: strings.personelHesabınızPasifYöneticinizleIletişimeGeçin },
        { status: 403 }
      );
    }

    if (!employee.pin_hash) {
      return NextResponse.json(
        { error: strings.personelŞifresiTanımlıDeğilYöneticinizleIletişime },
        { status: 403 }
      );
    }

    const pin = password.trim();

    let valid = false;
    try {
      valid = await bcrypt.compare(pin, employee.pin_hash);
    } catch {
      return NextResponse.json(
        { error: strings.personelŞifreKaydıBozukYöneticiPanelinden },
        { status: 500 }
      );
    }

    if (!valid) {
      console.warn('Personel giriş: PIN eşleşmedi', {
        employeeId: employee.id,
        isActive: employee.is_active,
      });
      return NextResponse.json({ error: strings.geçersizKimlikNumarasıVeyaŞifre }, { status: 401 });
    }

    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;
    const { error: sessionError } = await createPersonnelSession(admin, {
      employeeId: employee.id,
      tokenHash: hashToken(token),
      expiresAt: expiresAt.toISOString(),
      userAgent,
    });

    if (sessionError) {
      console.error('Oturum oluşturma hatası:', sessionError);
      const hint =
        sessionError.message.includes('personnel_sessions') ||
        sessionError.code === '42P01' ? strings.err001InitialSchemaSqlIçindekiPersonnel : sessionError.message;
      return NextResponse.json(
        {
          error: process.env.NODE_ENV === 'development' ? formatString(strings.oturumOluşturulamadıHint, { hint: hint }) : strings.oturumOluşturulamadıVeritabanıKurulumunuKontrolEdin,
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
        ? strings.supabaseServiceRoleKeyEnvDosyasındaTanımlıDeğil
        : strings.beklenmeyenSunucuHatasıKonsolLoglarınıKontrolEdin;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
