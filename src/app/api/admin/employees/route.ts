import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import {
  encryptField,
  PLACEHOLDER_IBAN,
  validateTcKimlik,
} from '@/lib/field-encryption';
import { formatFullName } from '@/lib/format';
import { assertIdentityUnique, mapIdentityUniqueViolation } from '@/lib/identity-uniqueness';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import { buildEmployeePinFields } from '@/lib/personnel-pin-storage';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/employees/route.json';

export async function POST(request: Request) {
  try {
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
        { error: strings.zorunluAlanlarEksikAdSoyadE },
        { status: 400 }
      );
    }

    await requireAdminProjectAccess(projectId);

    if (!validateTcKimlik(tc)) {
      return NextResponse.json({ error: strings.geçersizTCKimlikNumarası }, { status: 400 });
    }

    if (firstName != null || lastName != null) {
      if (!firstName?.trim() || !lastName?.trim()) {
        return NextResponse.json({ error: strings.adVeSoyadZorunludur }, { status: 400 });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: strings.geçerliBirEPostaGirin }, { status: 400 });
    }

    const pinError = validatePersonnelPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const pinFields = await buildEmployeePinFields(pin);
    const admin = createAdminClient();

    const hashes = await assertIdentityUnique(admin, {
      email: normalizedEmail,
      phone: phone || null,
      identityType: 'tc',
      identityNumber: tc,
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
        pin_hash: pinFields.pin_hash,
        pin_encrypted: pinFields.pin_encrypted,
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
      identity_type: 'tc',
      identity_number_enc: encryptField(tc),
      identity_lookup_hash: hashes.identityLookupHash,
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
    if (err instanceof Error) {
      const mapped = mapIdentityUniqueViolation(err.message);
      if (mapped || err.message.includes('zaten var') || err.message.includes('Geçersiz')) {
        return NextResponse.json({ error: mapped ?? err.message }, { status: 409 });
      }
    }
    const { status, message } = apiErrorMessage(err);
    if (status !== 500) {
      return NextResponse.json({ error: message }, { status });
    }
    console.error('Personel ekleme hatası:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
