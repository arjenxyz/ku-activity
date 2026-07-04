import { NextResponse } from 'next/server';
import { deleteAppReleaseApk } from '@/lib/app-release-storage';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import { createClient } from '@/utils/supabase/server';
import strings from '@json/src/app/api/developer/releases/[id]/route.json';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireDeveloperUser();
    const { id } = await ctx.params;
    const supabase = await createClient();

    const { data: release, error: fetchError } = await supabase
      .from('app_releases')
      .select('id, status, storage_path')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!release) {
      return NextResponse.json({ error: strings.sürümBulunamadı }, { status: 404 });
    }

    if (release.status !== 'pending') {
      return NextResponse.json({ error: strings.yalnızcaOnayBekleyenSürümlerSilinebilir }, { status: 400 });
    }

    await deleteAppReleaseApk(release.storage_path);

    const { error: deleteError } = await supabase.from('app_releases').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
