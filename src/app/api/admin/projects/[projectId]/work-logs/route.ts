import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

function monthRange(month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  return { start, end };
}

export async function GET(request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId } = await ctx.params;
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const approved = searchParams.get('approved');

    const supabase = await createClient();
    let q = supabase
      .from('work_logs')
      .select('*, employees(name)')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(200);

    if (employeeId) q = q.eq('employee_id', employeeId);
    if (approved === 'true') q = q.eq('approved', true);
    if (approved === 'false') q = q.eq('approved', false);
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
    await requireAdminUser();
    const { projectId } = await ctx.params;
    const body = await request.json();
    const { employeeId, date, amount, description, approved } = body as {
      employeeId?: string;
      date?: string;
      amount?: number;
      description?: string;
      approved?: boolean;
    };

    if (!employeeId || !date || amount == null) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        project_id: projectId,
        employee_id: employeeId,
        date,
        amount,
        description: description || null,
        approved: approved ?? true,
        approved_at: approved !== false ? new Date().toISOString() : null,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu tarih için zaten yevmiye kaydı var' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ record: data }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
