import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { queryProjectById, apiErrorMessage } from '@/lib/project-queries';
import type { ProjectFormData, ProjectStatus } from '@/types/project';
import strings from '@json/src/app/api/admin/projects/[projectId]/route.json';

const VALID_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'completed', 'archived'];

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    await requireAdminProjectAccess(projectId);

    const supabase = await createClient();
    const { data, error } = await queryProjectById(supabase, projectId);

    if (error || !data) {
      return NextResponse.json({ error: strings.projeBulunamadı }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    await requireAdminProjectAccess(projectId);
    const body = (await request.json()) as Partial<ProjectFormData>;

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: strings.geçersizDurum }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.code !== undefined) updates.code = body.code.trim() || null;
    if (body.location !== undefined) updates.location = body.location.trim() || null;
    if (body.start_date !== undefined) updates.start_date = body.start_date || null;
    if (body.end_date !== undefined) updates.end_date = body.end_date || null;
    if (body.description !== undefined) updates.description = body.description.trim() || null;
    if (body.status !== undefined) updates.status = body.status;
    if (body.work_start_time !== undefined) {
      updates.work_start_time = body.work_start_time || '08:00';
    }
    if (body.work_end_time !== undefined) {
      updates.work_end_time = body.work_end_time || null;
    }
    if (body.timezone !== undefined) {
      updates.timezone = body.timezone?.trim() || 'Europe/Istanbul';
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: strings.buProjeKoduZatenKullanılıyor }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Proje güncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    await requireAdminProjectAccess(projectId);

    const supabase = await createClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      console.error('Proje silme hatası:', error);
      return NextResponse.json({ error: error.message || 'Proje silinemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
