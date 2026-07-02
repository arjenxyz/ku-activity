import { NextResponse } from 'next/server';
import { verifyPendingRegistrationAccess } from '@/lib/registration-service';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identityType?: 'tc' | 'foreign';
      identityNumber?: string;
      tcKimlik?: string;
      pin?: string;
    };

    const identityType = body.identityType === 'foreign' ? 'foreign' : 'tc';
    const identityNumber = (body.identityNumber ?? body.tcKimlik ?? '').trim();
    const pin = body.pin ?? '';

    if (!identityNumber || !pin) {
      return NextResponse.json({ error: 'Kimlik numarası ve PIN gerekli' }, { status: 400 });
    }

    const result = await verifyPendingRegistrationAccess({ identityType, identityNumber, pin });

    if (result === 'expired') {
      return NextResponse.json(
        { error: 'Başvuru süresi dolmuş. Yeni başvuru yapabilirsiniz.' },
        { status: 410 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik numarası veya PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      verificationCode: result.verificationCode,
      approvalUrl: result.approvalUrl,
      identityType: result.identityType,
      identityNumber: result.identityNumber,
      tcKimlik: result.tcKimlik,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erişim başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
