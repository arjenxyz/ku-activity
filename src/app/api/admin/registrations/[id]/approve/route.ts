import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { approveRegistration } from '@/lib/registration-service';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const user = await requireAdminProjectAccess(String(body.projectId ?? ''));

    const result = await approveRegistration({
      registrationId: id,
      projectId: body.projectId,
      dailyWage: Number(body.dailyWage),
      position: body.position,
      hireDate: body.hireDate,
      approvedBy: user.id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status: status === 401 ? 401 : 400 });
  }
}
