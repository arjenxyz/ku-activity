import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { rejectRegistration } from '@/lib/registration-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    await rejectRegistration(id, (body as { reason?: string }).reason);
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
