import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminUser } from '@/lib/admin-auth';
import { formatFullName } from '@/lib/format';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const {
      projectId,
      name,
      firstName,
      lastName,
      email,
      phone,
      dailyWage,
      position,
      hireDate,
      pin,
    } = body as {
      projectId?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dailyWage?: number;
      position?: string;
      hireDate?: string;
      pin?: string;
    };

    const fullName =
      firstName != null || lastName != null
        ? formatFullName(firstName ?? '', lastName ?? '')
        : (name ?? '').trim();

    if (!projectId || !fullName || !email || !position || dailyWage == null || !pin) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik (ad, soyad, e-posta)' }, { status: 400 });
    }

    if (firstName != null || lastName != null) {
      if (!firstName?.trim() || !lastName?.trim()) {
        return NextResponse.json({ error: 'Ad ve soyad zorunludur' }, { status: 400 });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 12) {
      return NextResponse.json({ error: 'PIN 4-12 karakter olmalı' }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin, 12);
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('employees')
      .insert({
        project_id: projectId,
        name: fullName,
        email: normalizedEmail,
        phone: phone || null,
        daily_wage: dailyWage,
        position,
        hire_date: hireDate || null,
        pin_hash: pinHash,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Personel ekleme hatası:', error);
      return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }
    console.error('Personel ekleme hatası:', err);
    return NextResponse.json({ error: 'Sistem hatası' }, { status: 500 });
  }
}
