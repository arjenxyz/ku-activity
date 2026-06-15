import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import { validatePersonnelPin } from '@/lib/personnel-pin';
import { buildEmployeePinFields } from '@/lib/personnel-pin-storage';
type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const { pin } = (await request.json()) as { pin?: string };

    const pinError = validatePersonnelPin(pin ?? '');
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const pinFields = await buildEmployeePinFields(pin!);
    const supabase = await createClient();
    const { error } = await supabase
      .from('employees')
      .update(pinFields)
      .eq('id', employeeId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
