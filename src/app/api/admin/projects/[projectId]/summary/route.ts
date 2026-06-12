import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('v_project_financial_summary')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error?.message?.includes('v_project_financial_summary')) {
      return NextResponse.json({
        summary: {
          project_id: projectId,
          total_work_pay: 0,
          total_work_days: 0,
          total_advances: 0,
          total_deductions: 0,
          total_minimum: 0,
          employee_count: 0,
          active_employee_count: 0,
        },
        note: '004_menu_features.sql çalıştırın',
      });
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ summary: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
