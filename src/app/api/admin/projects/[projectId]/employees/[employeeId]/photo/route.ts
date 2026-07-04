import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/employees/[employeeId]/photo/route.json';
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

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
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

    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (empError || !employee) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const ext = extForMime(file.type);
    const path = employeePhotoObjectPath(projectId, employeeId, ext);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

    if (uploadError) {
      console.error('Fotoğraf yükleme hatası:', uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket') ? strings.err025PrivatePhotoStorageSqlÇalıştırın : strings.fotoğrafYüklenemedi,
        },
        { status: 500 }
      );
    }

    const { error: updateError } = await admin
      .from('employees')
      .update({ photo_path: path, photo_url: null })
      .eq('id', employeeId);

    if (updateError) {
      const hint = updateError.message.includes('photo_path') ? strings.err025PrivatePhotoStorageSqlÇalıştırın2 : strings.kayıtGüncellenemedi;
      return NextResponse.json({ error: hint }, { status: 500 });
    }

    const photoUrl = await signedEmployeePhotoUrl(path);
    return NextResponse.json({ photoUrl });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();

    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (empError || !employee) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    await Promise.all(
      exts.map((ext) =>
        admin.storage.from(EMPLOYEE_PHOTOS_BUCKET).remove([employeePhotoObjectPath(projectId, employeeId, ext)])
      )
    );

    const { error: clearError } = await admin
      .from('employees')
      .update({ photo_path: null, photo_url: null })
      .eq('id', employeeId);

    if (clearError && !clearError.message.includes('photo')) {
      return NextResponse.json({ error: strings.fotoğrafKaldırılamadı }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
