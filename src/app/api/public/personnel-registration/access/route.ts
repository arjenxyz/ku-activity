import { NextResponse } from 'next/server';
import { verifyPendingRegistrationAccess } from '@/lib/registration-service';
import strings from '@json/src/app/api/public/personnel-registration/access/route.json';

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
      return NextResponse.json({ error: strings.kimlikNumarasıVePinGerekli }, { status: 400 });
    }

    const result = await verifyPendingRegistrationAccess({ identityType, identityNumber, pin });

    if (result === 'expired') {
      return NextResponse.json(
        { error: strings.başvuruSüresiDolmuşYeniBaşvuruYapabilirsiniz },
        { status: 410 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: strings.geçersizKimlikNumarasıVeyaPin },
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
    const message = err instanceof Error ? err.message: strings.erişimBaşarısız;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
