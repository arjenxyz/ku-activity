import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;
    const { pin } = (await request.json()) as { pin?: string };

    if (!pin || pin.length < 4 || pin.length > 12) {
      return NextResponse.json({ error: 'PIN 4-12 karakter olmalı' }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin, 12);
    const supabase = await createClient();
    const { error } = await supabase
      .from('employees')
      .update({ pin_hash: pinHash })
      .eq('id', employeeId)
      .eq('project_id', projectId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
