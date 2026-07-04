import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { AdvanceRequestError, getActiveCashToken, regenerateCashToken } from '@/lib/advance-request-service';
import { buildAdvanceCashQrUrl } from '@/lib/advance-cash-token';
import { getTwaOrigin } from '@/lib/twa-config';

type Ctx = { params: Promise<{ projectId: string; id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId, id } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const regenerate = new URL(request.url).searchParams.get('regenerate') === '1';

    const admin = createAdminClient();
    const tokenRow = regenerate
      ? await regenerateCashToken(admin, id, projectId)
      : (await getActiveCashToken(admin, id, projectId)) ??
        (await regenerateCashToken(admin, id, projectId));

    if (!tokenRow?.token) {
      return NextResponse.json({ error: 'Aktif nakit kodu bulunamadı' }, { status: 404 });
    }

    const qrUrl = buildAdvanceCashQrUrl(tokenRow.token, getTwaOrigin());
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 280 });

    return NextResponse.json({
      token: tokenRow.token,
      expiresAt: tokenRow.expires_at,
      qrUrl,
      qrDataUrl,
    });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return NextResponse.json({ error: 'QR oluşturulamadı' }, { status: 500 });
  }
}
