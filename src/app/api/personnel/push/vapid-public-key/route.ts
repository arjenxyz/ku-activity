import { NextResponse } from 'next/server';
import { getVapidDiagnostics } from '@/lib/personnel-push-service';

export async function GET() {
  const diagnostics = getVapidDiagnostics();
  if (!diagnostics.configured || !diagnostics.publicKey) {
    return NextResponse.json({ enabled: false, publicKey: null, keyPairValid: false });
  }
  return NextResponse.json({
    enabled: diagnostics.keyPairValid,
    publicKey: diagnostics.publicKey,
    keyPairValid: diagnostics.keyPairValid,
    ...(diagnostics.keyPairValid
      ? {}
      : {
          error:
            'VAPID public/private key uyumsuz. npx web-push generate-vapid-keys ile yeni çift oluşturup Vercel env güncelleyin.',
        }),
  });
}
