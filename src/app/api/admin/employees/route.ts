import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  encryptField,
  PLACEHOLDER_IBAN,
  validateTcKimlik,
} from '@/lib/field-encryption';
import { formatFullName } from '@/lib/format';
import { assertIdentityUnique, mapIdentityUniqueViolation } from '@/lib/identity-uniqueness';
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
      iban,
      birthDate,
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
      iban?: string;
      birthDate?: string;
    };

    const fullName =
      firstName != null || lastName != null
        ? formatFullName(firstName ?? '', lastName ?? '')
        : (name ?? '').trim();

    const tc = (tcKimlik ?? '').replace(/\D/g, '');
    const resolvedIban = (iban?.trim() || PLACEHOLDER_IBAN).toUpperCase();
    const resolvedBirthDate = birthDate?.trim() || '1970-01-01';

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

    const hashes = await assertIdentityUnique(admin, {
      email: normalizedEmail,
      phone: phone || null,
      tcKimlik: tc,
      iban: resolvedIban,
    });

    const { data, error } = await admin
      .from('employees')
      .insert({
        project_id: projectId,
        name: fullName,
        email: normalizedEmail,
        phone: phone?.trim() || null,
        phone_lookup_hash: hashes.phoneLookupHash,
        daily_wage: dailyWage,
        position,
        hire_date: hireDate || null,
        pin_hash: pinHash,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Personel ekleme hatası:', error);
      const mapped = mapIdentityUniqueViolation(error.message ?? '');
      return NextResponse.json(
        { error: mapped ?? 'Kayıt oluşturulamadı' },
        { status: mapped ? 409 : 500 }
      );
    }

    const { error: sensError } = await admin.from('employee_sensitive_data').insert({
      employee_id: data.id,
      tc_kimlik_enc: encryptField(tc),
      birth_date_enc: encryptField(resolvedBirthDate),
      iban_enc: encryptField(resolvedIban),
      tc_lookup_hash: hashes.tcLookupHash,
      iban_lookup_hash: hashes.ibanLookupHash,
    });

    if (sensError) {
      await admin.from('employees').delete().eq('id', data.id);
      console.error('Hassas veri ekleme hatası:', sensError);
      const mapped = mapIdentityUniqueViolation(sensError.message ?? '');
      return NextResponse.json(
        { error: mapped ?? 'Personel T.C. kaydı oluşturulamadı' },
        { status: mapped ? 409 : 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }
    if (err instanceof Error) {
      const mapped = mapIdentityUniqueViolation(err.message);
      if (mapped || err.message.includes('zaten var') || err.message.includes('Geçersiz')) {
        return NextResponse.json({ error: mapped ?? err.message }, { status: 409 });
      }
    }
    console.error('Personel ekleme hatası:', err);
    return NextResponse.json({ error: 'Sistem hatası' }, { status: 500 });
  }
}
