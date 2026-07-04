import { NextResponse } from 'next/server';
import { verifyContractOtpAndSubmit } from '@/lib/otp-service';
import strings from '@json/src/app/api/public/contract-otp/verify/route.json';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const result = await verifyContractOtpAndSubmit({
      email: body.email ?? '',
      code: body.code ?? '',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      submitted: true,
      verificationCode: result.verificationCode,
      approvalUrl: result.approvalUrl,
      reused: result.reused,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.doğrulamaBaşarısız;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
