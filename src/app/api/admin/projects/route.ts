import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { queryProjectsList, apiErrorMessage } from '@/lib/project-queries';
import { mergeProjectClosureFields } from '@/lib/project-closure-merge';
import { getAdminProjectQuota } from '@/lib/project-admin-quota';
import type { ProjectFormData, ProjectStatus } from '@/types/project';
import strings from '@json/src/app/api/admin/projects/route.json';

const VALID_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'completed', 'archived'];

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser();
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

    const projects = await mergeProjectClosureFields(
      (data ?? []) as Record<string, unknown>[]
    );

    const quota = await getAdminProjectQuota(user.id);

    return NextResponse.json({ projects, quota });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = (await request.json()) as ProjectFormData;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: strings.projeAdıGerekli }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: strings.geçersizDurum }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: strings.oturumGerekli }, { status: 401 });
    }

    const quota = await getAdminProjectQuota(user.id);
    if (!quota.canCreate) {
      return NextResponse.json({ error: strings.activeProjectLimit }, { status: 409 });
    }

    const { data, error } = await supabase.rpc('create_project_for_admin', {
      p_user_id: user.id,
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
      if (error.message.includes('ACTIVE_PROJECT_LIMIT')) {
        return NextResponse.json({ error: strings.activeProjectLimit }, { status: 409 });
      }
      if (error.message.includes('create_project_for_admin')) {
        return NextResponse.json(
          { error: strings.migrationRequired },
          { status: 503 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: strings.buProjeKoduZatenKullanılıyor }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Proje oluşturulamadı' }, { status: 500 });
    }

    // İş saatleri / saat dilimi RPC ile ayarlanmadığı için oluşturma sonrası kaydet.
    const scheduleUpdates: Record<string, unknown> = {};
    if (body.work_start_time) scheduleUpdates.work_start_time = body.work_start_time;
    if (body.work_end_time) scheduleUpdates.work_end_time = body.work_end_time;
    if (body.timezone?.trim()) scheduleUpdates.timezone = body.timezone.trim();

    const createdId = (data as { id?: string } | null)?.id;
    if (createdId && Object.keys(scheduleUpdates).length > 0) {
      const { data: updated, error: scheduleError } = await supabase
        .from('projects')
        .update(scheduleUpdates)
        .eq('id', createdId)
        .select('*')
        .single();
      if (!scheduleError && updated) {
        return NextResponse.json({ project: updated }, { status: 201 });
      }
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
