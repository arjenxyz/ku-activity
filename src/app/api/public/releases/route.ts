import { NextResponse } from 'next/server';
import { APP_RELEASE_TYPES, type AppReleaseRow } from '@/lib/app-releases';
import { createAdminClient } from '@/utils/supabase/admin';
import strings from '@json/src/app/api/public/releases/route.json';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('app_releases')
      .select(
        'id, app_type, version_name, version_code, file_size, sha256, release_notes, published_at, created_at'
      )
      .eq('status', 'published')
      .order('version_code', { ascending: false });

    if (error) {
      if (error.message.includes('app_releases')) {
        return NextResponse.json({ releases: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as AppReleaseRow[];
    const latestByApp = APP_RELEASE_TYPES.map((appType) => {
      const release = rows.find((row) => row.app_type === appType);
      return release
        ? {
            appType,
            id: release.id,
            versionName: release.version_name,
            versionCode: release.version_code,
            fileSize: release.file_size,
            sha256: release.sha256,
            releaseNotes: release.release_notes,
            publishedAt: release.published_at,
          }
        : { appType, id: null };
    });

    return NextResponse.json({ releases: latestByApp });
  } catch (err) {
    const message = err instanceof Error ? err.message: strings.sistemHatası;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
