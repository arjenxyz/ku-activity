import { NextResponse } from 'next/server';
import { validateAdminRegister } from '@/lib/admin-register-validation';
import { formatFullName } from '@/lib/format';
import { toStoredTurkishPhone } from '@/lib/field-encryption';
import { createAdminClient } from '@/utils/supabase/admin';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('already') || lower.includes('registered')) {
    return 'Bu e-posta zaten kayıtlı';
  }
  if (lower.includes('database error creating new user')) {
    return 'Veritabanı hatası: Supabase\'de 008_auth_profile_trigger.sql dosyasını çalıştırın.';
  }
  if (lower.includes('password')) {
    return 'Şifre Supabase kurallarına uymuyor (en az 6 karakter).';
  }
  return message;
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
      fullName: legacyFullName,
      phone,
      companyName,
      jobTitle,
      city,
      teamSize,
      projectCount,
      referralSource,
    } = body as {
      email?: string;
      password?: string;
      passwordConfirm?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      phone?: string;
      companyName?: string;
      jobTitle?: string;
      city?: string;
      teamSize?: string;
      projectCount?: string;
      referralSource?: string;
    };

    const resolvedFirst = firstName?.trim() || legacyFullName?.trim().split(' ')[0] || '';
    const resolvedLast =
      lastName?.trim() ||
      legacyFullName?.trim().split(' ').slice(1).join(' ') ||
      '';
    const fullName =
      formatFullName(resolvedFirst, resolvedLast) || legacyFullName?.trim() || '';

    const validationError = validateAdminRegister({
      firstName: resolvedFirst,
      lastName: resolvedLast,
      email: email ?? '',
      phone: phone ?? '',
      companyName: companyName ?? '',
      jobTitle: jobTitle ?? '',
      city: city ?? '',
      teamSize: teamSize ?? '',
      projectCount: projectCount ?? '',
      referralSource: referralSource ?? '',
      password: password ?? '',
      passwordConfirm: passwordConfirm ?? password ?? '',
    });

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalized = normalizeEmail(email!);
    const storedPhone = toStoredTurkishPhone(phone!.trim());
    const admin = createAdminClient();

    const onboarding = {
      company_name: companyName!.trim(),
      job_title: jobTitle!.trim(),
      city: city!.trim(),
      team_size: teamSize!.trim(),
      project_count: projectCount!.trim(),
      referral_source: referralSource?.trim() || null,
    };

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalized,
      password: password!,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        phone: storedPhone,
        role: 'admin',
        ...onboarding,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth createUser:', authError);
      return NextResponse.json(
        { error: mapAuthError(authError?.message || 'Hesap oluşturulamadı') },
        { status: 400 }
      );
    }

    const profilePayload = {
      id: authData.user.id,
      full_name: fullName,
      phone: storedPhone,
      role: 'admin' as const,
      is_active: true,
      company_name: onboarding.company_name,
      job_title: onboarding.job_title,
      city: onboarding.city,
      team_size: onboarding.team_size,
      project_count: onboarding.project_count,
      referral_source: onboarding.referral_source,
    };

    const { error: rpcError } = await admin.rpc('upsert_admin_profile', {
      p_user_id: authData.user.id,
      p_full_name: fullName,
      p_phone: storedPhone,
      p_company_name: onboarding.company_name,
      p_job_title: onboarding.job_title,
      p_city: onboarding.city,
      p_team_size: onboarding.team_size,
      p_project_count: onboarding.project_count,
      p_referral_source: onboarding.referral_source,
    });

    if (rpcError) {
      const { error: profileError } = await admin.from('profiles').upsert(profilePayload);

      if (profileError) {
        console.error('Profil oluşturma:', rpcError, profileError);
        await admin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          {
            error:
              'Profil oluşturulamadı. Supabase\'de 049_admin_onboarding_fields.sql migration dosyasını çalıştırın.',
            detail: profileError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err) {
    console.error('Admin kayıt hatası:', err);
    return NextResponse.json({ error: 'Kayıt sırasında hata oluştu' }, { status: 500 });
  }
}
