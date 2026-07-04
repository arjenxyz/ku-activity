import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { loadProjectProfitOverview } from '@/lib/job-profit-service';
import strings from '@json/src/app/api/admin/projects/[projectId]/jobs/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('project_jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ jobs: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { name, unitLabel, unitPrice, quantity, notes, blockId } = body as {
      name?: string;
      unitLabel?: string;
      unitPrice?: number;
      quantity?: number;
      notes?: string;
      blockId?: string | null;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: strings.i̇şKalemiAdıZorunlu }, { status: 400 });
    }
    if (unitPrice == null || unitPrice < 0) {
      return NextResponse.json({ error: strings.birimFiyatGeçersiz }, { status: 400 });
    }
    if (quantity == null || quantity <= 0) {
      return NextResponse.json({ error: strings.miktar0DanBüyükOlmalı }, { status: 400 });
    }

    const admin = createAdminClient();
    const { count } = await admin
      .from('project_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { data, error } = await admin
      .from('project_jobs')
      .insert({
        project_id: projectId,
        name: name.trim(),
        unit_label: (unitLabel?.trim() || 'm²').slice(0, 32),
        unit_price: unitPrice,
        quantity,
        notes: notes?.trim() || null,
        block_id: blockId ?? null,
        sort_order: count ?? 0,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const overview = await loadProjectProfitOverview(admin, projectId);
    return NextResponse.json({ job: data, overview }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
