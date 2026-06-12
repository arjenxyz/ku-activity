import { NextResponse } from 'next/server';
import type { ContractAcceptanceInput } from '@/lib/contract-service';
import { prepareContractOtpRegistration } from '@/lib/otp-service';

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
    const formData = await request.formData();
    const photo = formData.get('photo');
    const acceptances = parseAcceptances(formData.get('contractAcceptances'));

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: 'Fotoğraf gerekli' }, { status: 400 });
    }

    const result = await prepareContractOtpRegistration({
      draft: {
        firstName: String(formData.get('firstName') ?? ''),
        lastName: String(formData.get('lastName') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
        tcKimlik: String(formData.get('tcKimlik') ?? ''),
        birthDate: String(formData.get('birthDate') ?? ''),
        iban: String(formData.get('iban') ?? ''),
        pin: String(formData.get('pin') ?? ''),
        contractAcceptances: acceptances,
      },
      photo,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kod gönderilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
