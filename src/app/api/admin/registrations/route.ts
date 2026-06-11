import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { listPendingRegistrations } from '@/lib/registration-service';
import { apiErrorMessage } from '@/lib/project-queries';

export async function GET() {
  try {
    await requireAdminUser();
    const items = await listPendingRegistrations();
    return NextResponse.json({ registrations: items });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
