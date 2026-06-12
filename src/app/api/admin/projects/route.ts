import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { queryProjectsList, apiErrorMessage } from '@/lib/project-queries';
import type { ProjectFormData, ProjectStatus } from '@/types/project';

const VALID_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'completed', 'archived'];

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search')?.trim() || '';

    const supabase = await createClient();
    const { data, error } = await queryProjectsList(supabase, filter, search);

    if (error) {
      console.error('Proje listesi hatası:', error);
      return NextResponse.json(
        { error: error.message || 'Projeler yüklenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = (await request.json()) as ProjectFormData & { verificationCode?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Proje adı gerekli' }, { status: 400 });
    }
    if (!body.verificationCode?.trim()) {
      return NextResponse.json(
        {
          error:
            'Proje oluşturmak için doğrulama kodu gerekli. Destek e-postasına başvurun.',
        },
        { status: 400 }
      );
    }
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('create_project_with_verification', {
      p_user_id: user.id,
      p_verification_code: body.verificationCode.trim(),
      p_name: body.name.trim(),
      p_project_code: body.code?.trim() || null,
      p_location: body.location?.trim() || null,
      p_start_date: body.start_date || null,
      p_end_date: body.end_date || null,
      p_description: body.description?.trim() || null,
      p_status: body.status,
    });

    if (error) {
      console.error('Proje oluşturma hatası:', error);
      if (error.message.includes('INVALID_CODE') || error.message.includes('CODE_ALREADY_USED')) {
        return NextResponse.json(
          { error: 'Geçersiz, süresi dolmuş veya kullanılmış doğrulama kodu' },
          { status: 400 }
        );
      }
      if (error.message.includes('create_project_with_verification')) {
        return NextResponse.json(
          { error: '007_verification_system.sql çalıştırın' },
          { status: 503 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu proje kodu zaten kullanılıyor' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Proje oluşturulamadı' }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
