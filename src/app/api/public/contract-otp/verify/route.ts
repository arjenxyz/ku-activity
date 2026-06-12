import { NextResponse } from 'next/server';
import { verifyContractOtp } from '@/lib/otp-service';
import type { OtpChannel } from '@/lib/otp-delivery';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      channel?: OtpChannel;
      email?: string;
      code?: string;
    };

    const channel = body.channel === 'sms' ? 'sms' : 'email';
    const result = await verifyContractOtp({
      channel,
      email: body.email ?? '',
      code: body.code ?? '',
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Doğrulama başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
