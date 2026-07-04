import { NextResponse } from 'next/server';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import strings from '@json/src/app/api/personnel/me/photo/route.json';
import {
  EMPLOYEE_PHOTOS_BUCKET,
  employeePhotoObjectPath,
  signedEmployeePhotoUrl,
} from '@/lib/photo-storage';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: strings.dosyaGerekli }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: strings.yalnızcaJpegPngWebpVeyaGif },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: strings.dosyaEnFazla5MbOlabilir }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: employee } = await admin
      .from('employees')
      .select('id')
      .eq('id', session.employeeId)
      .eq('project_id', session.projectId)
      .maybeSingle();

    if (!employee) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const path = employeePhotoObjectPath(session.projectId, session.employeeId, extForMime(file.type));
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });
    if (uploadError) {
      return NextResponse.json({ error: strings.fotoğrafYüklenemedi }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from('employees')
      .update({ photo_path: path, photo_url: null })
      .eq('id', session.employeeId);
    if (updateError) {
      return NextResponse.json({ error: strings.fotoğrafKaydıGüncellenemedi }, { status: 500 });
    }

    return NextResponse.json({ photoUrl: await signedEmployeePhotoUrl(path) });
  } catch {
    return NextResponse.json({ error: strings.yetkisiz }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data: employee } = await admin
      .from('employees')
      .select('id')
      .eq('id', session.employeeId)
      .eq('project_id', session.projectId)
      .maybeSingle();

    if (!employee) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    await Promise.all(
      exts.map((ext) =>
        admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove([employeePhotoObjectPath(session.projectId, session.employeeId, ext)])
      )
    );

    const { error: clearError } = await admin
      .from('employees')
      .update({ photo_path: null, photo_url: null })
      .eq('id', session.employeeId);

    if (clearError && !clearError.message.includes('photo')) {
      return NextResponse.json({ error: strings.fotoğrafKaldırılamadı }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: strings.yetkisiz }, { status: 401 });
  }
}
