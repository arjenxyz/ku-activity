import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = 'employee-photos';

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Yalnızca JPEG, PNG, WebP veya GIF yükleyebilirsiniz' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Dosya en fazla 5 MB olabilir' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const ext = extForMime(file.type);
    const path = `${projectId}/${employeeId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

    if (uploadError) {
      console.error('Fotoğraf yükleme hatası:', uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')
              ? '012_employee_photos.sql çalıştırın (storage bucket)'
              : 'Fotoğraf yüklenemedi',
        },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const photoUrl = urlData.publicUrl;

    const { error: updateError } = await admin
      .from('employees')
      .update({ photo_url: photoUrl })
      .eq('id', employeeId);

    if (updateError) {
      const hint = updateError.message.includes('photo_url')
        ? '013_schema_repair.sql çalıştırın (photo_url kolonu)'
        : 'Kayıt güncellenemedi';
      return NextResponse.json({ error: hint }, { status: 500 });
    }

    return NextResponse.json({ photoUrl });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;
    const admin = createAdminClient();

    const { data: employee, error: empError } = await admin
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    await Promise.all(
      exts.map((ext) =>
        admin.storage.from(BUCKET).remove([`${projectId}/${employeeId}.${ext}`])
      )
    );

    const { error: clearError } = await admin
      .from('employees')
      .update({ photo_url: null })
      .eq('id', employeeId);

    if (clearError && !clearError.message.includes('photo_url')) {
      return NextResponse.json({ error: 'Fotoğraf kaldırılamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
