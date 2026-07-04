import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { AdvanceRequestError, createAdvanceRequest } from '@/lib/advance-request-service';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('advance_requests')
      .select(
        'id, requested_amount, approved_amount, employee_note, admin_note, status, payment_method, requested_at, approved_at, paid_at, rejected_at, cancelled_at, rejection_reason, deduction_id'
      )
      .eq('employee_id', session.employeeId)
      .order('requested_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.message.includes('advance_requests')) {
        return NextResponse.json({ requests: [], note: '056_advance_requests.sql çalıştırın' });
      }
      return NextResponse.json({ error: 'Talepler yüklenemedi' }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const body = await request.json();
    const amount = Number(body.amount);
    const note = typeof body.note === 'string' ? body.note : undefined;

    const admin = createAdminClient();
    const record = await createAdvanceRequest(admin, {
      projectId: session.projectId,
      employeeId: session.employeeId,
      amount,
      note,
    });

    return NextResponse.json({ request: record }, { status: 201 });
  } catch (err) {
    if (err instanceof AdvanceRequestError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Talep oluşturulamadı' }, { status: 500 });
  }
}
