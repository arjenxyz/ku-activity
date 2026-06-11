import { NextResponse } from 'next/server';
import {
  attachRegistrationPhoto,
  submitRegistrationApplication,
} from '@/lib/registration-service';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const photo = formData.get('photo');

      const result = await submitRegistrationApplication({
        firstName: String(formData.get('firstName') ?? ''),
        lastName: String(formData.get('lastName') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
        tcKimlik: String(formData.get('tcKimlik') ?? ''),
        birthDate: String(formData.get('birthDate') ?? ''),
        iban: String(formData.get('iban') ?? ''),
      });

      if (!(photo instanceof File) || photo.size === 0) {
        return NextResponse.json({ error: 'Kendi fotoğrafınızı çekmeniz gerekir' }, { status: 400 });
      }

      await attachRegistrationPhoto(result.id, photo);

      return NextResponse.json({
        verificationCode: result.verificationCode,
        approvalUrl: result.approvalUrl,
        reused: result.reused,
      });
    }

    const body = await request.json();
    const result = await submitRegistrationApplication({
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      email: body.email ?? '',
      phone: body.phone,
      tcKimlik: body.tcKimlik ?? '',
      birthDate: body.birthDate ?? '',
      iban: body.iban ?? '',
    });

    return NextResponse.json({
      verificationCode: result.verificationCode,
      approvalUrl: result.approvalUrl,
      reused: result.reused,
      photoRequired: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Başvuru başarısız';
    const status = message.includes('KEY') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
