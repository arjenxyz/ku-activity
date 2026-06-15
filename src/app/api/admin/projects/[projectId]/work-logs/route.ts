import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import { adminConfirmWorkLog } from '@/lib/work-log-service';
import type { MesaiType } from '@/lib/work-log';

type Ctx = { params: Promise<{ projectId: string }> };

function monthRange(month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { start, end };
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const approved = searchParams.get('approved');
    const disputed = searchParams.get('disputed');

    const supabase = createAdminClient();
    let q = supabase
      .from('work_logs')
      .select('*, employees(name)')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(200);

    if (employeeId) q = q.eq('employee_id', employeeId);
    if (approved === 'true') q = q.eq('approved', true);
    if (approved === 'false') q = q.eq('approved', false);
    if (disputed === 'true') q = q.not('employee_disputed_at', 'is', null);
    if (month) {
      const { start, end } = monthRange(month);
      q = q.gte('date', start).lte('date', end);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ records: data ?? [] });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    const user = await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const { employeeId, date, amount, description, mesaiType, jobId } = body as {
      employeeId?: string;
      date?: string;
      amount?: number;
      description?: string;
      mesaiType?: MesaiType;
      jobId?: string | null;
    };

    if (!employeeId || !date || amount == null) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
    }

    if (amount !== 1 && amount !== 0.5) {
      return NextResponse.json({ error: 'Gün miktarı tam (1) veya yarım (0.5) olmalı' }, { status: 400 });
    }

    const mesai = mesaiType ?? 'none';
    if (mesai !== 'none' && amount < 1) {
      return NextResponse.json(
        { error: 'Mesai yalnızca tam gün çalışmada tanımlanabilir' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const record = await adminConfirmWorkLog(supabase, {
      projectId,
      employeeId,
      date,
      amount,
      mesaiType: mesai,
      description: description ?? null,
      approvedBy: user.id,
      jobId: jobId ?? null,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt oluşturulamadı';
    const status = message.includes('zaten') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
