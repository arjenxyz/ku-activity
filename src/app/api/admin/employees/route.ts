import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  encryptField,
  hashTcKimlik,
  validateTcKimlik,
} from '@/lib/field-encryption';
import { formatFullName } from '@/lib/format';
import { validatePersonnelPin } from '@/lib/personnel-pin';
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
      tcKimlik,
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
      tcKimlik?: string;
    };

    const fullName =
      firstName != null || lastName != null
        ? formatFullName(firstName ?? '', lastName ?? '')
        : (name ?? '').trim();

    const tc = (tcKimlik ?? '').replace(/\D/g, '');

    if (!projectId || !fullName || !email || !position || dailyWage == null || !pin || !tc) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik (ad, soyad, e-posta, T.C. kimlik)' },
        { status: 400 }
      );
    }

    if (!validateTcKimlik(tc)) {
      return NextResponse.json({ error: 'Geçersiz T.C. kimlik numarası' }, { status: 400 });
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

    const pinError = validatePersonnelPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin.trim(), 12);
    const admin = createAdminClient();
    const tcLookupHash = hashTcKimlik(tc);

    const { data: existingTc } = await admin
      .from('employee_sensitive_data')
      .select('employee_id')
      .eq('tc_lookup_hash', tcLookupHash)
      .maybeSingle();

    if (existingTc) {
      return NextResponse.json(
        { error: 'Bu T.C. kimlik numarası ile kayıtlı personel zaten var' },
        { status: 400 }
      );
    }

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

    const { error: sensError } = await admin.from('employee_sensitive_data').insert({
      employee_id: data.id,
      tc_kimlik_enc: encryptField(tc),
      birth_date_enc: encryptField('1970-01-01'),
      iban_enc: encryptField('TR000000000000000000000000'),
      tc_lookup_hash: tcLookupHash,
    });

    if (sensError) {
      await admin.from('employees').delete().eq('id', data.id);
      console.error('Hassas veri ekleme hatası:', sensError);
      return NextResponse.json({ error: 'Personel T.C. kaydı oluşturulamadı' }, { status: 500 });
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
