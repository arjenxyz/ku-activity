import { NextResponse } from 'next/server';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { WIPE_CONFIRM_PHRASE } from '@/lib/developer-wipe';
import { wipeApplicationStorage } from '@/lib/developer-wipe-storage';
import { createClient } from '@/utils/supabase/server';
import strings from '@json/src/app/api/developer/wipe-database/route.json';
import { formatString } from '@/lib/strings/format';

export async function POST(request: Request) {
  try {
    await requireDeveloperUser();

    const body = (await request.json()) as { confirmPhrase?: string };
    if (body.confirmPhrase?.trim() !== WIPE_CONFIRM_PHRASE) {
      return NextResponse.json(
        {
          error: formatString(strings.onayMetniHatalıKutucuğaTamOlarak, { WIPE_CONFIRM_PHRASE: WIPE_CONFIRM_PHRASE }),
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('developer_wipe_application_data');

    if (error) {
      const message = error.message.includes('UNAUTHORIZED') ? strings.yetkisiz : error.message.includes('developer_wipe_application_data')
          ? '027_developer_wipe_data.sql migration çalıştırın'
          : error.message;
      const status = error.message.includes('UNAUTHORIZED') ? 401 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const storage = await wipeApplicationStorage();

    return NextResponse.json({
      ok: true,
      deleted: data?.deleted ?? data,
      storage,
      preserved: ['profiles', 'auth.users', 'personnel_contracts (şablonlar)'],
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.yetkisiz }, { status: 401 });
    }
    console.error('[developer/wipe-database]', err);
    return NextResponse.json({ error: strings.verilerSilinemedi }, { status: 500 });
  }
}
