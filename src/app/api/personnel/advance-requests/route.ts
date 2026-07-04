import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  buildPaymentDetailsFromOcr,
  sanitizeOcrForPersonnel,
} from '@/lib/advance-payment-details';
import { AdvanceRequestError, createAdvanceRequest } from '@/lib/advance-request-service';

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('advance_requests')
      .select(
        'id, requested_amount, approved_amount, employee_note, admin_note, status, payment_method, requested_at, approved_at, paid_at, rejected_at, cancelled_at, rejection_reason, deduction_id, proof_reference_no, proof_ocr_json'
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

    const requests = (data ?? []).map((row) => {
      const ocr = sanitizeOcrForPersonnel(row.proof_ocr_json as Record<string, unknown> | null);
      const paymentDetails =
        row.status === 'paid' && row.payment_method === 'bank_transfer'
          ? buildPaymentDetailsFromOcr(ocr, row)
          : null;

      return {
        id: row.id,
        requested_amount: row.requested_amount,
        approved_amount: row.approved_amount,
        employee_note: row.employee_note,
        admin_note: row.admin_note,
        status: row.status,
        payment_method: row.payment_method,
        requested_at: row.requested_at,
        approved_at: row.approved_at,
        paid_at: row.paid_at,
        rejected_at: row.rejected_at,
        cancelled_at: row.cancelled_at,
        rejection_reason: row.rejection_reason,
        deduction_id: row.deduction_id,
        proof_reference_no: row.proof_reference_no,
        payment_details: paymentDetails,
      };
    });

    return NextResponse.json({ requests });
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
