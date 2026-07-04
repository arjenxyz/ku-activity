import { NextResponse } from 'next/server';
import { confirmContractOtpLink } from '@/lib/otp-service';
import strings from '@json/src/app/api/public/contract-otp/confirm-link/route.json';

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('k') ?? '';
    const result = await confirmContractOtpLink({
      linkToken: token,
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
