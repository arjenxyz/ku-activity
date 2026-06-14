import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { apiErrorMessage } from '@/lib/project-queries';
import {
  fetchCompanyWagePolicy,
  upsertCompanyWagePolicy,
} from '@/lib/wage-policy-service';
import { normalizeWagePolicy } from '@/types/wage-policy';

export async function GET() {
  try {
    const user = await requireAdminUser();
    const policy = await fetchCompanyWagePolicy(user.id);
    return NextResponse.json({ policy });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminUser();
    const body = await request.json();
    const policy = normalizeWagePolicy(body.policy ?? body);
    const saved = await upsertCompanyWagePolicy(user.id, policy);
    return NextResponse.json({ policy: saved });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
