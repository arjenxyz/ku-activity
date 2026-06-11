import { NextResponse } from 'next/server';
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
    const { email, password, fullName, phone } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
    };

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'E-posta, şifre ve ad soyad zorunludur' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const admin = createAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        phone: phone?.trim() || '',
        role: 'admin',
      },
    });

    if (authError || !authData.user) {
      console.error('Auth createUser:', authError);
      return NextResponse.json(
        { error: mapAuthError(authError?.message || 'Hesap oluşturulamadı') },
        { status: 400 }
      );
    }

    const { error: rpcError } = await admin.rpc('upsert_admin_profile', {
      p_user_id: authData.user.id,
      p_full_name: fullName.trim(),
      p_phone: phone?.trim() || null,
    });

    if (rpcError) {
      const { error: profileError } = await admin.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        role: 'admin',
        is_active: true,
      });

      if (profileError) {
        console.error('Profil oluşturma:', rpcError, profileError);
        await admin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          {
            error:
              'Profil oluşturulamadı. Supabase\'de 001 ve 008_auth_profile_trigger.sql çalıştırın.',
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
