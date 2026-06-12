import { NextResponse } from 'next/server';
import { sendContractOtp } from '@/lib/otp-service';
import type { OtpChannel } from '@/lib/otp-delivery';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      channel?: OtpChannel;
      email?: string;
      phone?: string;
    };

    const channel = body.channel === 'sms' ? 'sms' : 'email';
    const email = body.email ?? '';
    const phone = body.phone ?? null;

    const result = await sendContractOtp({ channel, email, phone });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kod gönderilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
