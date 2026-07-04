import { NextResponse } from 'next/server';
import { signedAppReleaseDownloadUrl } from '@/lib/app-release-storage';
import { isValidAppReleaseType } from '@/lib/app-releases';
import { createAdminClient } from '@/utils/supabase/admin';
import strings from '@json/src/app/api/public/releases/[appType]/download/route.json';

type Ctx = { params: Promise<{ appType: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { appType } = await ctx.params;

    if (!isValidAppReleaseType(appType)) {
      return NextResponse.json({ error: strings.geçersizUygulamaTürü }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: release, error } = await admin
      .from('app_releases')
      .select('storage_path, version_name, version_code')
      .eq('app_type', appType)
      .eq('status', 'published')
      .order('version_code', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!release) {
      return NextResponse.json({ error: strings.yayınlanmışSürümBulunamadı }, { status: 404 });
    }

    const signedUrl = await signedAppReleaseDownloadUrl(release.storage_path, 3600);
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.i̇ndirmeBaşarısız;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
