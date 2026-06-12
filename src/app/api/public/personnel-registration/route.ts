import { NextResponse } from 'next/server';
import {
  attachRegistrationPhoto,
  submitRegistrationApplication,
} from '@/lib/registration-service';
import { recordContractAcceptances, type ContractAcceptanceInput } from '@/lib/contract-service';

function parseAcceptances(raw: FormDataEntryValue | null): ContractAcceptanceInput[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw) as ContractAcceptanceInput[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => typeof item.contractId === 'string' && typeof item.version === 'number'
    );
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const userAgent = request.headers.get('user-agent');

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const photo = formData.get('photo');
      const acceptances = parseAcceptances(formData.get('contractAcceptances'));

      const firstName = String(formData.get('firstName') ?? '');
      const lastName = String(formData.get('lastName') ?? '');
      const email = String(formData.get('email') ?? '');

      const result = await submitRegistrationApplication({
        firstName,
        lastName,
        email,
        phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
        tcKimlik: String(formData.get('tcKimlik') ?? ''),
        birthDate: String(formData.get('birthDate') ?? ''),
        iban: String(formData.get('iban') ?? ''),
        pin: String(formData.get('pin') ?? ''),
      });

      await recordContractAcceptances({
        registrationRequestId: result.id,
        email,
        firstName,
        lastName,
        acceptances,
        userAgent,
      });

      if (!(photo instanceof File) || photo.size === 0) {
        return NextResponse.json({ error: 'Kendi fotoğrafınızı çekmeniz gerekir' }, { status: 400 });
      }

      await attachRegistrationPhoto(result.id, photo);

      return NextResponse.json({
        verificationCode: result.verificationCode,
        approvalUrl: result.approvalUrl,
        reused: result.reused,
        contractsRecorded: true,
      });
    }

    const body = await request.json();
    const acceptances = Array.isArray(body.contractAcceptances)
      ? (body.contractAcceptances as ContractAcceptanceInput[])
      : [];

    const result = await submitRegistrationApplication({
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      email: body.email ?? '',
      phone: body.phone,
      tcKimlik: body.tcKimlik ?? '',
      birthDate: body.birthDate ?? '',
      iban: body.iban ?? '',
      pin: body.pin ?? '',
    });

    await recordContractAcceptances({
      registrationRequestId: result.id,
      email: body.email ?? '',
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      acceptances,
      userAgent,
    });

    return NextResponse.json({
      verificationCode: result.verificationCode,
      approvalUrl: result.approvalUrl,
      reused: result.reused,
      photoRequired: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Başvuru başarısız';
    const isConfig =
      message.includes('FIELD_ENCRYPTION_KEY') || message.includes('SUPABASE_SERVICE_ROLE_KEY');
    if (isConfig) {
      console.error('[personnel-registration] Sunucu yapılandırması eksik:', message);
      return NextResponse.json(
        { error: 'Başvuru şu an alınamıyor. Lütfen daha sonra tekrar deneyin veya yöneticinize bildirin.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
