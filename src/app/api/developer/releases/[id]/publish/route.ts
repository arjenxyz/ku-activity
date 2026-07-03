import { NextResponse } from 'next/server';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import { createClient } from '@/utils/supabase/server';
import type { AppReleaseRow } from '@/lib/app-releases';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const user = await requireDeveloperUser();
    const { id } = await ctx.params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('publish_app_release', {
      p_release_id: id,
      p_developer_id: user.id,
    });

    if (error) {
      if (error.message.includes('publish_app_release') || error.message.includes('app_releases')) {
        return NextResponse.json({ error: '054_app_releases.sql çalıştırın' }, { status: 503 });
      }
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json({ error: 'Sürüm bulunamadı' }, { status: 404 });
      }
      if (error.message.includes('INVALID_STATUS')) {
        return NextResponse.json({ error: 'Yalnızca onay bekleyen sürümler yayınlanabilir' }, { status: 400 });
      }
      if (error.message.includes('UNAUTHORIZED')) {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ release: data as AppReleaseRow });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
