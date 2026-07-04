import dayjs from 'dayjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  advanceCashTokenExpiresAt,
  generateAdvanceCashToken,
  normalizeAdvanceCashToken,
} from '@/lib/advance-cash-token';
import { uploadAdvanceDekont, type StorageBackend } from '@/lib/advance-external-storage';
import type { AdvancePaymentMethod, AdvanceRequestStatus } from '@/lib/advance-types';

export class AdvanceRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400
  ) {
    super(message);
    this.name = 'AdvanceRequestError';
  }
}

type AdminActor = { id: string };

async function loadRequest(admin: SupabaseClient, requestId: string, projectId?: string) {
  let q = admin.from('advance_requests').select('*').eq('id', requestId);
  if (projectId) q = q.eq('project_id', projectId);
  const { data, error } = await q.maybeSingle();
  if (error) {
    if (error.message.includes('advance_requests')) {
      throw new AdvanceRequestError('056_advance_requests.sql çalıştırın', 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }
  if (!data) throw new AdvanceRequestError('Talep bulunamadı', 'NOT_FOUND', 404);
  return data as {
    id: string;
    project_id: string;
    employee_id: string;
    requested_amount: number;
    approved_amount: number | null;
    status: AdvanceRequestStatus;
    payment_method: AdvancePaymentMethod | null;
    job_id: string | null;
    employee_note: string | null;
    deduction_id: string | null;
  };
}

async function insertDeduction(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    amount: number;
    date: string;
    description: string;
    jobId?: string | null;
  }
) {
  const { data, error } = await admin
    .from('deductions')
    .insert({
      project_id: params.projectId,
      employee_id: params.employeeId,
      date: params.date,
      type: 'advance',
      amount: params.amount,
      description: params.description,
      job_id: params.jobId ?? null,
    })
    .select('id')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DEDUCTION', 500);
  return data.id as string;
}

export async function createAdvanceRequest(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    amount: number;
    note?: string;
  }
) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdvanceRequestError('Geçerli bir tutar girin', 'INVALID_AMOUNT');
  }

  const { data, error } = await admin
    .from('advance_requests')
    .insert({
      project_id: params.projectId,
      employee_id: params.employeeId,
      requested_amount: params.amount,
      employee_note: params.note?.trim() || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    if (error.message.includes('advance_requests')) {
      throw new AdvanceRequestError('056_advance_requests.sql çalıştırın', 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }
  return data;
}

export async function cancelAdvanceRequest(
  admin: SupabaseClient,
  params: { requestId: string; employeeId: string }
) {
  const row = await loadRequest(admin, params.requestId);
  if (row.employee_id !== params.employeeId) {
    throw new AdvanceRequestError('Bu talebe erişiminiz yok', 'FORBIDDEN', 403);
  }
  if (row.status !== 'pending') {
    throw new AdvanceRequestError('Yalnızca bekleyen talepler iptal edilebilir', 'INVALID_STATUS');
  }

  const { data, error } = await admin
    .from('advance_requests')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', params.requestId)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}

export async function approveAdvanceRequest(
  admin: SupabaseClient,
  params: {
    projectId: string;
    requestId: string;
    approvedAmount: number;
    paymentMethod: AdvancePaymentMethod;
    adminNote?: string;
    jobId?: string | null;
    actor: AdminActor;
  }
) {
  const row = await loadRequest(admin, params.requestId, params.projectId);
  if (row.status !== 'pending') {
    throw new AdvanceRequestError('Yalnızca bekleyen talepler onaylanabilir', 'INVALID_STATUS');
  }
  if (!Number.isFinite(params.approvedAmount) || params.approvedAmount <= 0) {
    throw new AdvanceRequestError('Geçerli onay tutarı girin', 'INVALID_AMOUNT');
  }

  const now = new Date().toISOString();
  const nextStatus: AdvanceRequestStatus =
    params.paymentMethod === 'cash' ? 'awaiting_receipt' : 'approved';

  const { data, error } = await admin
    .from('advance_requests')
    .update({
      status: nextStatus,
      approved_amount: params.approvedAmount,
      payment_method: params.paymentMethod,
      admin_note: params.adminNote?.trim() || null,
      job_id: params.jobId ?? null,
      approved_at: now,
      approved_by: params.actor.id,
    })
    .eq('id', params.requestId)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);

  if (params.paymentMethod === 'cash') {
    await admin
      .from('advance_cash_tokens')
      .update({ is_active: false })
      .eq('advance_request_id', params.requestId)
      .eq('is_active', true);

    const token = generateAdvanceCashToken();
    const { error: tokenError } = await admin.from('advance_cash_tokens').insert({
      advance_request_id: params.requestId,
      token,
      expires_at: advanceCashTokenExpiresAt().toISOString(),
    });
    if (tokenError) throw new AdvanceRequestError(tokenError.message, 'TOKEN', 500);
  }

  return data;
}

export async function rejectAdvanceRequest(
  admin: SupabaseClient,
  params: {
    projectId: string;
    requestId: string;
    reason?: string;
    actor: AdminActor;
  }
) {
  const row = await loadRequest(admin, params.requestId, params.projectId);
  if (!['pending', 'approved', 'awaiting_receipt'].includes(row.status)) {
    throw new AdvanceRequestError('Bu talep reddedilemez', 'INVALID_STATUS');
  }

  const { data, error } = await admin
    .from('advance_requests')
    .update({
      status: 'rejected',
      rejection_reason: params.reason?.trim() || null,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', params.requestId)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);

  await admin
    .from('advance_cash_tokens')
    .update({ is_active: false })
    .eq('advance_request_id', params.requestId)
    .eq('is_active', true);

  return data;
}

export async function recordBankPayment(
  admin: SupabaseClient,
  params: {
    projectId: string;
    requestId: string;
    paymentDate?: string;
    referenceNo?: string;
    fileBuffer?: Buffer;
    fileName: string;
    mimeType: string;
    actor: AdminActor;
    backend?: StorageBackend;
    existingProof?: {
      backend: StorageBackend;
      externalId: string;
    };
    proofOcrJson?: Record<string, unknown> | null;
  }
) {
  const row = await loadRequest(admin, params.requestId, params.projectId);
  if (row.status !== 'approved') {
    throw new AdvanceRequestError('Havale ödemesi yalnızca onaylanmış taleplerde kaydedilebilir', 'INVALID_STATUS');
  }
  if (row.payment_method !== 'bank_transfer') {
    throw new AdvanceRequestError('Bu talep havale ile onaylanmadı', 'INVALID_METHOD');
  }

  const amount = row.approved_amount ?? row.requested_amount;
  const payDate = params.paymentDate ?? dayjs().format('YYYY-MM-DD');

  const proof = params.existingProof
    ? { backend: params.existingProof.backend, externalId: params.existingProof.externalId }
    : await uploadAdvanceDekont({
        buffer: params.fileBuffer!,
        fileName: params.fileName,
        mimeType: params.mimeType,
        projectId: params.projectId,
        requestId: params.requestId,
        backend: params.backend,
      });

  if (!params.existingProof && !params.fileBuffer) {
    throw new AdvanceRequestError('Dekont dosyası gerekli', 'MISSING_FILE');
  }

  const deductionId = await insertDeduction(admin, {
    projectId: row.project_id,
    employeeId: row.employee_id,
    amount,
    date: payDate,
    description: `Avans (talep ${params.requestId.slice(0, 8)})`,
    jobId: row.job_id,
  });

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('advance_requests')
    .update({
      status: 'paid',
      paid_at: now,
      paid_by: params.actor.id,
      deduction_id: deductionId,
      proof_storage_backend: proof.backend,
      proof_external_id: proof.externalId,
      proof_file_name: params.fileName,
      proof_mime_type: params.mimeType,
      proof_reference_no: params.referenceNo?.trim() || null,
      proof_ocr_json: params.proofOcrJson ?? null,
    })
    .eq('id', params.requestId)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}

export async function confirmCashAdvance(
  admin: SupabaseClient,
  params: { token: string; employeeId: string }
) {
  const normalized = normalizeAdvanceCashToken(params.token);
  if (!normalized) {
    throw new AdvanceRequestError('Geçersiz avans kodu', 'INVALID_TOKEN');
  }

  const { data: tokenRow, error: tokenError } = await admin
    .from('advance_cash_tokens')
    .select('*, advance_requests(*)')
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (tokenError) {
    if (tokenError.message.includes('advance_cash_tokens')) {
      throw new AdvanceRequestError('056_advance_requests.sql çalıştırın', 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(tokenError.message, 'DB', 500);
  }
  if (!tokenRow) throw new AdvanceRequestError('Kod geçersiz veya kullanılmış', 'INVALID_TOKEN');

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    await admin.from('advance_cash_tokens').update({ is_active: false }).eq('id', tokenRow.id);
    await admin
      .from('advance_requests')
      .update({ status: 'expired' })
      .eq('id', tokenRow.advance_request_id)
      .eq('status', 'awaiting_receipt');
    throw new AdvanceRequestError('Kodun süresi dolmuş', 'EXPIRED');
  }

  const request = tokenRow.advance_requests as {
    id: string;
    project_id: string;
    employee_id: string;
    requested_amount: number;
    approved_amount: number | null;
    status: AdvanceRequestStatus;
    payment_method: AdvancePaymentMethod | null;
    job_id: string | null;
  };

  if (request.employee_id !== params.employeeId) {
    throw new AdvanceRequestError('Bu kod size ait değil', 'FORBIDDEN', 403);
  }
  if (request.status !== 'awaiting_receipt' || request.payment_method !== 'cash') {
    throw new AdvanceRequestError('Bu talep nakit onayı beklemiyor', 'INVALID_STATUS');
  }

  const amount = request.approved_amount ?? request.requested_amount;
  const payDate = dayjs().format('YYYY-MM-DD');
  const deductionId = await insertDeduction(admin, {
    projectId: request.project_id,
    employeeId: request.employee_id,
    amount,
    date: payDate,
    description: `Nakit avans (talep ${request.id.slice(0, 8)})`,
    jobId: request.job_id,
  });

  const now = new Date().toISOString();
  await admin
    .from('advance_cash_tokens')
    .update({ is_active: false, confirmed_at: now })
    .eq('id', tokenRow.id);

  const { data, error } = await admin
    .from('advance_requests')
    .update({
      status: 'paid',
      paid_at: now,
      deduction_id: deductionId,
    })
    .eq('id', request.id)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}

export async function getActiveCashToken(admin: SupabaseClient, requestId: string, projectId: string) {
  await loadRequest(admin, requestId, projectId);

  const { data, error } = await admin
    .from('advance_cash_tokens')
    .select('token, expires_at')
    .eq('advance_request_id', requestId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}

export async function regenerateCashToken(admin: SupabaseClient, requestId: string, projectId: string) {
  const row = await loadRequest(admin, requestId, projectId);
  if (row.status !== 'awaiting_receipt' || row.payment_method !== 'cash') {
    throw new AdvanceRequestError('Nakit QR yalnızca teslim bekleyen taleplerde oluşturulur', 'INVALID_STATUS');
  }

  await admin
    .from('advance_cash_tokens')
    .update({ is_active: false })
    .eq('advance_request_id', requestId)
    .eq('is_active', true);

  const token = generateAdvanceCashToken();
  const { data, error } = await admin
    .from('advance_cash_tokens')
    .insert({
      advance_request_id: requestId,
      token,
      expires_at: advanceCashTokenExpiresAt().toISOString(),
    })
    .select('token, expires_at')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}
