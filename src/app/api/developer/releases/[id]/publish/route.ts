import { NextResponse } from 'next/server';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import { createAdminClient } from '@/utils/supabase/admin';
import type { AppReleaseRow } from '@/lib/app-releases';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const user = await requireDeveloperUser();
    const { id } = await ctx.params;
    const supabase = createAdminClient();

    const { data: release, error: fetchError } = await supabase
      .from('app_releases')
      .select('id, app_type, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      if (fetchError.message.includes('app_releases')) {
        return NextResponse.json({ error: '054_app_releases.sql çalıştırın' }, { status: 503 });
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!release) {
      return NextResponse.json({ error: 'Sürüm bulunamadı' }, { status: 404 });
    }

    if (release.status !== 'pending') {
      return NextResponse.json({ error: 'Yalnızca onay bekleyen sürümler yayınlanabilir' }, { status: 400 });
    }

    const { error: archiveError } = await supabase
      .from('app_releases')
      .update({ status: 'archived' })
      .eq('app_type', release.app_type)
      .eq('status', 'published');

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('app_releases')
      .update({
        status: 'published',
        published_by: user.id,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        'id, app_type, version_name, version_code, storage_path, file_size, sha256, release_notes, status, uploaded_by, published_by, published_at, created_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ release: data as AppReleaseRow });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
