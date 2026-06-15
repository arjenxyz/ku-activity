import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { loadProjectProfitOverview } from '@/lib/job-profit-service';

type Ctx = { params: Promise<{ projectId: string; jobId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('project_job_expenses')
      .select('*')
      .eq('project_id', projectId)
      .eq('job_id', jobId)
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expenses: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, jobId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { date, amount, description } = body as {
      date?: string;
      amount?: number;
      description?: string;
    };

    if (amount == null || amount <= 0) {
      return NextResponse.json({ error: 'Geçerli tutar girin' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: job, error: jobError } = await admin
      .from('project_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json({ error: 'İş kalemi bulunamadı' }, { status: 404 });
    }

    const { data, error } = await admin
      .from('project_job_expenses')
      .insert({
        project_id: projectId,
        job_id: jobId,
        date: date ?? new Date().toISOString().slice(0, 10),
        amount,
        description: description?.trim() || null,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ expense: data, overview }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
