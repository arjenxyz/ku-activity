import { NextResponse } from 'next/server';
import { authorizeReleaseUpload } from '@/lib/app-release-auth';
import { uploadAppReleaseApk, deleteAppReleaseApk } from '@/lib/app-release-storage';
import { isValidAppReleaseType, type AppReleaseRow } from '@/lib/app-releases';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    await requireDeveloperUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('app_releases')
      .select(
        'id, app_type, version_name, version_code, storage_path, file_size, sha256, release_notes, status, uploaded_by, published_by, published_at, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (error.message.includes('app_releases')) {
        return NextResponse.json({ error: '054_app_releases.sql çalıştırın' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ releases: (data ?? []) as AppReleaseRow[] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  let storagePath: string | null = null;

  try {
    const auth = await authorizeReleaseUpload(request);
    const formData = await request.formData();

    const appTypeRaw = String(formData.get('appType') ?? formData.get('app_type') ?? '').trim();
    const versionName = String(formData.get('versionName') ?? formData.get('version_name') ?? '').trim();
    const versionCodeRaw = String(formData.get('versionCode') ?? formData.get('version_code') ?? '').trim();
    const releaseNotes = String(formData.get('releaseNotes') ?? formData.get('release_notes') ?? '').trim();
    const file = formData.get('file');

    if (!isValidAppReleaseType(appTypeRaw)) {
      return NextResponse.json({ error: 'appType personnel veya admin olmalı' }, { status: 400 });
    }

    if (!versionName) {
      return NextResponse.json({ error: 'versionName gerekli' }, { status: 400 });
    }

    const versionCode = Number.parseInt(versionCodeRaw, 10);
    if (!Number.isFinite(versionCode) || versionCode <= 0) {
      return NextResponse.json({ error: 'versionCode pozitif tam sayı olmalı' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'APK dosyası gerekli' }, { status: 400 });
    }

    const uploaded = await uploadAppReleaseApk({
      appType: appTypeRaw,
      versionName,
      versionCode,
      file,
    });
    storagePath = uploaded.storagePath;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_releases')
      .insert({
        app_type: appTypeRaw,
        version_name: versionName,
        version_code: versionCode,
        storage_path: uploaded.storagePath,
        file_size: uploaded.fileSize,
        sha256: uploaded.sha256,
        release_notes: releaseNotes || null,
        status: 'pending',
        uploaded_by: auth.userId,
      })
      .select(
        'id, app_type, version_name, version_code, storage_path, file_size, sha256, release_notes, status, uploaded_by, published_by, published_at, created_at'
      )
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu uygulama için aynı sürüm kodu zaten kayıtlı' }, { status: 409 });
      }
      if (error.message.includes('app_releases')) {
        return NextResponse.json({ error: '054_app_releases.sql çalıştırın' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        release: data as AppReleaseRow,
        message: auth.viaCi
          ? 'APK yüklendi. Developer panelden yayınlayın.'
          : 'APK yüklendi. Yayınlamak için onaylayın.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (storagePath) {
      try {
        await deleteAppReleaseApk(storagePath);
      } catch {
        // ignore cleanup failure
      }
    }
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status: status === 500 && message === 'UNAUTHORIZED' ? 401 : status });
  }
}
