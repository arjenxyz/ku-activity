import { NextResponse } from 'next/server';
import type { ContractAcceptanceInput } from '@/lib/contract-service';
import { prepareContractOtpRegistration } from '@/lib/otp-service';
import strings from '@json/src/app/api/public/contract-otp/prepare/route.json';

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

    const result = await prepareContractOtpRegistration({
      draft: {
        firstName: String(formData.get('firstName') ?? ''),
        lastName: String(formData.get('lastName') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? ''),
        identityType: (String(formData.get('identityType') ?? 'tc') as 'tc' | 'foreign'),
        identityNumber: String(formData.get('identityNumber') ?? ''),
        tcKimlik: String(formData.get('tcKimlik') ?? ''),
        birthDate: String(formData.get('birthDate') ?? ''),
        iban: String(formData.get('iban') ?? ''),
        pin: String(formData.get('pin') ?? ''),
        contractAcceptances: acceptances,
      },
      photo: photo instanceof File && photo.size > 0 ? photo : null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.kodGönderilemedi;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
