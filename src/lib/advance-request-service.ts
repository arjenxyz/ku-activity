import {
  computeIbanLookupHash,
  normalizeIban,
} from '@/lib/field-encryption';
import {
  advanceCashTokenExpiresAt,
  generateAdvanceCashToken,
  normalizeAdvanceCashToken,
} from '@/lib/advance-cash-token';
import {
  advanceTransferTokenExpiresAt,
  generateAdvanceTransferToken,
  normalizeAdvanceTransferToken,
  parseAdvanceTransferTokenFromText,
} from '@/lib/advance-transfer-token';
import { uploadAdvanceDekont, type StorageBackend } from '@/lib/advance-external-storage';
import type { AdvancePaymentMethod, AdvanceRequestStatus } from '@/lib/advance-types';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/advance-request-service.json';
import {
  notifyAdvanceApproved,
  notifyAdvancePaid,
  notifyAdvanceRejected,
} from '@/lib/personnel-notification-service';
import { FORCE_PAYMENT_MAX_AGE_DAYS } from '@/lib/dekont-validation';
import dayjs from 'dayjs';
import type { SupabaseClient } from '@supabase/supabase-js';

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
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }
  if (!data) throw new AdvanceRequestError(strings.notFound, 'NOT_FOUND', 404);
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
    approved_at: string | null;
    is_retroactive: boolean;
  };
}

async function assertEmployeeInProject(
  admin: SupabaseClient,
  employeeId: string,
  projectId: string
) {
  const { data, error } = await admin
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  if (!data) throw new AdvanceRequestError(strings.employeeNotInProject, 'NOT_FOUND', 404);
}

async function assertEmployeeIbanMatches(
  admin: SupabaseClient,
  employeeId: string,
  recipientIban: string
) {
  const hash = computeIbanLookupHash(normalizeIban(recipientIban));
  const { data, error } = await admin
    .from('employee_sensitive_data')
    .select('iban_lookup_hash')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  if (!data?.iban_lookup_hash || data.iban_lookup_hash !== hash) {
    throw new AdvanceRequestError(strings.ibanMismatch, 'IBAN_MISMATCH', 422);
  }
}

async function assertDuplicateReference(
  admin: SupabaseClient,
  refNo: string | undefined,
  excludeRequestId?: string
) {
  const trimmed = refNo?.trim();
  if (!trimmed) return;

  let q = admin
    .from('advance_requests')
    .select('id')
    .eq('proof_reference_no', trimmed)
    .eq('status', 'paid');
  if (excludeRequestId) q = q.neq('id', excludeRequestId);

  const { data, error } = await q.limit(1);
  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  if (data?.length) {
    throw new AdvanceRequestError(strings.duplicateReference, 'DUPLICATE_PROOF', 409);
  }
}

async function assertForcePaymentAllowed(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    approvedAmount: number;
    approvedAt: string | null;
    paymentDate: string;
    ocrJson: Record<string, unknown>;
  }
) {
  const recipientIban =
    typeof params.ocrJson.recipientIban === 'string' ? params.ocrJson.recipientIban : null;
  if (!recipientIban) {
    throw new AdvanceRequestError(strings.forcePaymentIbanRequired, 'IBAN_MISMATCH', 422);
  }
  await assertEmployeeIbanMatches(admin, params.employeeId, recipientIban);

  const ocrAmount =
    typeof params.ocrJson.amount === 'number' ? params.ocrJson.amount : null;
  if (ocrAmount == null || ocrAmount <= 0) {
    throw new AdvanceRequestError(strings.forcePaymentAmountRequired, 'INVALID_AMOUNT', 422);
  }
  if (Math.abs(ocrAmount - params.approvedAmount) > 1) {
    throw new AdvanceRequestError(strings.forcePaymentAmountMismatch, 'AMOUNT_MISMATCH', 422);
  }

  if (!params.approvedAt) {
    throw new AdvanceRequestError(strings.forcePaymentNoApprovalDate, 'INVALID_STATUS', 422);
  }

  const approvedDay = dayjs(params.approvedAt).startOf('day');
  const paymentDay = dayjs(params.paymentDate).startOf('day');
  if (!paymentDay.isBefore(approvedDay)) {
    throw new AdvanceRequestError(strings.forcePaymentNotBeforeApproval, 'PAYMENT_DATE', 422);
  }

  const daysSincePayment = dayjs().startOf('day').diff(paymentDay, 'day');
  if (daysSincePayment > FORCE_PAYMENT_MAX_AGE_DAYS) {
    throw new AdvanceRequestError(
      formatString(strings.forcePaymentTooOld, { maxDays: FORCE_PAYMENT_MAX_AGE_DAYS }),
      'PAYMENT_DATE',
      422
    );
  }
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

async function assertCanCreateAdvanceRequest(admin: SupabaseClient, employeeId: string) {
  const { data, error } = await admin
    .from('advance_requests')
    .select('id, status')
    .eq('employee_id', employeeId)
    .in('status', ['approved', 'awaiting_receipt'])
    .limit(1);

  if (error) {
    if (error.message.includes('advance_requests')) {
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }

  if (data?.length) {
    throw new AdvanceRequestError(strings.openAdvanceBlocksNewRequest, 'OPEN_ADVANCE', 409);
  }
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
    throw new AdvanceRequestError(strings.invalidAmount, 'INVALID_AMOUNT');
  }

  await assertCanCreateAdvanceRequest(admin, params.employeeId);

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
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }
  return data;
}

export async function createAdvanceRequestOnBehalf(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    amount: number;
    note?: string;
    adminNote?: string;
    actor: AdminActor;
  }
) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdvanceRequestError(strings.invalidAmount, 'INVALID_AMOUNT');
  }

  await assertEmployeeInProject(admin, params.employeeId, params.projectId);

  const { data, error } = await admin
    .from('advance_requests')
    .insert({
      project_id: params.projectId,
      employee_id: params.employeeId,
      requested_amount: params.amount,
      employee_note: params.note?.trim() || null,
      admin_note: params.adminNote?.trim() || null,
      status: 'pending',
      initiated_by: 'admin',
    })
    .select('*')
    .single();

  if (error) {
    if (error.message.includes('advance_requests')) {
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
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
    throw new AdvanceRequestError(strings.forbidden, 'FORBIDDEN', 403);
  }
  if (row.status !== 'pending') {
    throw new AdvanceRequestError(strings.cancelPendingOnly, 'INVALID_STATUS');
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
    retroactive?: boolean;
    paymentDate?: string;
  }
) {
  const row = await loadRequest(admin, params.requestId, params.projectId);
  if (row.status !== 'pending') {
    throw new AdvanceRequestError(strings.approvePendingOnly, 'INVALID_STATUS');
  }
  if (!Number.isFinite(params.approvedAmount) || params.approvedAmount <= 0) {
    throw new AdvanceRequestError(strings.invalidApprovedAmount, 'INVALID_AMOUNT');
  }

  const isRetroactive = params.retroactive === true;
  if (isRetroactive && params.paymentMethod !== 'bank_transfer') {
    throw new AdvanceRequestError(strings.retroactiveBankOnly, 'INVALID_METHOD');
  }
  if (isRetroactive && !params.paymentDate?.trim()) {
    throw new AdvanceRequestError(strings.retroactivePaymentDateRequired, 'INVALID_DATE');
  }

  const approvedAt = isRetroactive
    ? dayjs(params.paymentDate).startOf('day').toISOString()
    : new Date().toISOString();
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
      approved_at: approvedAt,
      approved_by: params.actor.id,
      is_retroactive: isRetroactive,
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

  if (params.paymentMethod === 'bank_transfer' && !isRetroactive) {
    await admin
      .from('advance_transfer_tokens')
      .update({ is_active: false })
      .eq('advance_request_id', params.requestId)
      .eq('is_active', true);

    const transferToken = generateAdvanceTransferToken();
    const { error: transferError } = await admin.from('advance_transfer_tokens').insert({
      advance_request_id: params.requestId,
      token: transferToken,
      expires_at: advanceTransferTokenExpiresAt().toISOString(),
    });
    if (transferError) {
      if (transferError.message.includes('advance_transfer_tokens')) {
        throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
      }
      throw new AdvanceRequestError(transferError.message, 'TOKEN', 500);
    }
  }

  let activeTransferToken: string | null = null;
  if (params.paymentMethod === 'bank_transfer' && !isRetroactive) {
    const tokenRow = await getActiveTransferToken(admin, params.requestId, params.projectId);
    activeTransferToken = tokenRow?.token ?? null;
  }

  if (!isRetroactive) {
    try {
      await notifyAdvanceApproved(admin, {
        employeeId: row.employee_id,
        projectId: row.project_id,
        requestId: params.requestId,
        amount: params.approvedAmount,
        paymentMethod: params.paymentMethod,
        transferToken: activeTransferToken,
      });
    } catch {
      /* bildirim isteğe bağlı */
    }
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
    throw new AdvanceRequestError(strings.cannotReject, 'INVALID_STATUS');
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

  await admin
    .from('advance_transfer_tokens')
    .update({ is_active: false })
    .eq('advance_request_id', params.requestId)
    .eq('is_active', true);

  try {
    await notifyAdvanceRejected(admin, {
      employeeId: row.employee_id,
      projectId: row.project_id,
      requestId: params.requestId,
      reason: params.reason,
    });
  } catch {
    /* bildirim isteğe bağlı */
  }

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
    transferCodeOverride?: boolean;
    forcePaymentOverride?: boolean;
  }
) {
  const row = await loadRequest(admin, params.requestId, params.projectId);
  if (row.status !== 'approved') {
    throw new AdvanceRequestError(strings.bankPaymentApprovedOnly, 'INVALID_STATUS');
  }
  if (row.payment_method !== 'bank_transfer') {
    throw new AdvanceRequestError(strings.notBankTransfer, 'INVALID_METHOD');
  }

  const amount = row.approved_amount ?? row.requested_amount;
  const payDate = params.paymentDate ?? dayjs().format('YYYY-MM-DD');
  const isRetroactive = row.is_retroactive === true;
  const forcePayment = params.forcePaymentOverride === true;
  const ocrJson = params.proofOcrJson ?? {};

  if (forcePayment) {
    await assertForcePaymentAllowed(admin, {
      employeeId: row.employee_id,
      approvedAmount: amount,
      approvedAt: row.approved_at,
      paymentDate: payDate,
      ocrJson,
    });
  }

  const activeToken =
    isRetroactive || forcePayment
      ? null
      : await getActiveTransferToken(admin, params.requestId, params.projectId);
  const rawText = typeof ocrJson.rawText === 'string' ? ocrJson.rawText : '';
  const ocrToken =
    (typeof ocrJson.transferToken === 'string' ? ocrJson.transferToken : null) ??
    parseAdvanceTransferTokenFromText(rawText);

  if (!isRetroactive && !forcePayment && activeToken?.token) {
    const normalizedExpected = normalizeAdvanceTransferToken(activeToken.token);
    const normalizedOcr = ocrToken ? normalizeAdvanceTransferToken(ocrToken) : null;
    const tokenOk = normalizedExpected && normalizedOcr && normalizedExpected === normalizedOcr;
    if (!tokenOk && !params.transferCodeOverride) {
      throw new AdvanceRequestError(strings.transferCodeRequired, 'TRANSFER_CODE', 422);
    }
  }

  if (!isRetroactive && !forcePayment && row.approved_at && payDate) {
    const approvedDay = dayjs(row.approved_at).startOf('day');
    const paymentDay = dayjs(payDate).startOf('day');
    if (paymentDay.isBefore(approvedDay.subtract(1, 'day'))) {
      throw new AdvanceRequestError(strings.paymentBeforeApproval, 'PAYMENT_DATE', 422);
    }
  }

  await assertDuplicateReference(admin, params.referenceNo, params.requestId);

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
    throw new AdvanceRequestError(strings.missingFile, 'MISSING_FILE');
  }

  const deductionId = await insertDeduction(admin, {
    projectId: row.project_id,
    employeeId: row.employee_id,
    amount,
    date: payDate,
    description: formatString(strings.deductionDescriptionBank, {
      requestIdPrefix: params.requestId.slice(0, 8),
    }),
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
      proof_ocr_json: {
        ...ocrJson,
        ...(params.transferCodeOverride ? { transferCodeOverride: true } : {}),
        ...(isRetroactive || forcePayment ? { retroactive: true } : {}),
        ...(forcePayment ? { forcePayment: true } : {}),
      },
      ...(forcePayment ? { is_retroactive: true } : {}),
    })
    .eq('id', params.requestId)
    .select('*')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);

  if (activeToken?.id) {
    await admin
      .from('advance_transfer_tokens')
      .update({ is_active: false, matched_at: now })
      .eq('id', activeToken.id);
  }

  try {
    await notifyAdvancePaid(admin, {
      employeeId: row.employee_id,
      projectId: row.project_id,
      requestId: params.requestId,
      amount,
    });
  } catch {
    /* bildirim isteğe bağlı */
  }

  return data;
}

export async function recordRetroactiveBankPayment(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    amount: number;
    paymentDate: string;
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
    adminNote?: string;
    jobId?: string | null;
  }
) {
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdvanceRequestError(strings.invalidAmount, 'INVALID_AMOUNT');
  }
  if (!params.paymentDate?.trim()) {
    throw new AdvanceRequestError(strings.retroactivePaymentDateRequired, 'INVALID_DATE');
  }

  await assertEmployeeInProject(admin, params.employeeId, params.projectId);

  const ocrJson = params.proofOcrJson ?? {};
  const recipientIban =
    typeof ocrJson.recipientIban === 'string' ? ocrJson.recipientIban : null;
  if (!recipientIban) {
    throw new AdvanceRequestError(strings.ibanMismatch, 'IBAN_MISMATCH', 422);
  }
  await assertEmployeeIbanMatches(admin, params.employeeId, recipientIban);
  await assertDuplicateReference(admin, params.referenceNo);

  const requestId = crypto.randomUUID();
  const payDate = params.paymentDate;

  const proof = params.existingProof
    ? { backend: params.existingProof.backend, externalId: params.existingProof.externalId }
    : await uploadAdvanceDekont({
        buffer: params.fileBuffer!,
        fileName: params.fileName,
        mimeType: params.mimeType,
        projectId: params.projectId,
        requestId,
        backend: params.backend,
      });

  if (!params.existingProof && !params.fileBuffer) {
    throw new AdvanceRequestError(strings.missingFile, 'MISSING_FILE');
  }

  const deductionId = await insertDeduction(admin, {
    projectId: params.projectId,
    employeeId: params.employeeId,
    amount: params.amount,
    date: payDate,
    description: formatString(strings.deductionDescriptionRetroactive, {
      requestIdPrefix: requestId.slice(0, 8),
    }),
    jobId: params.jobId ?? null,
  });

  const approvedAt = dayjs(payDate).startOf('day').toISOString();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('advance_requests')
    .insert({
      id: requestId,
      project_id: params.projectId,
      employee_id: params.employeeId,
      requested_amount: params.amount,
      approved_amount: params.amount,
      employee_note: null,
      admin_note: params.adminNote?.trim() || null,
      status: 'paid',
      payment_method: 'bank_transfer',
      job_id: params.jobId ?? null,
      requested_at: approvedAt,
      approved_at: approvedAt,
      paid_at: now,
      approved_by: params.actor.id,
      paid_by: params.actor.id,
      initiated_by: 'admin',
      is_retroactive: true,
      deduction_id: deductionId,
      proof_storage_backend: proof.backend,
      proof_external_id: proof.externalId,
      proof_file_name: params.fileName,
      proof_mime_type: params.mimeType,
      proof_reference_no: params.referenceNo?.trim() || null,
      proof_ocr_json: {
        ...ocrJson,
        retroactive: true,
        initiatedBy: 'admin',
      },
    })
    .select('*')
    .single();

  if (error) {
    if (error.message.includes('advance_requests')) {
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }

  try {
    await notifyAdvancePaid(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      requestId,
      amount: params.amount,
    });
  } catch {
    /* bildirim isteğe bağlı */
  }

  return data;
}

export async function getActiveTransferToken(
  admin: SupabaseClient,
  requestId: string,
  projectId: string
) {
  await loadRequest(admin, requestId, projectId);

  const { data, error } = await admin
    .from('advance_transfer_tokens')
    .select('id, token, expires_at')
    .eq('advance_request_id', requestId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.message.includes('advance_transfer_tokens')) {
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(error.message, 'DB', 500);
  }
  return data;
}

export async function regenerateTransferToken(
  admin: SupabaseClient,
  requestId: string,
  projectId: string
) {
  const row = await loadRequest(admin, requestId, projectId);
  if (row.status !== 'approved' || row.payment_method !== 'bank_transfer') {
    throw new AdvanceRequestError(strings.transferRegenerateApprovedOnly, 'INVALID_STATUS');
  }

  await admin
    .from('advance_transfer_tokens')
    .update({ is_active: false })
    .eq('advance_request_id', requestId)
    .eq('is_active', true);

  const token = generateAdvanceTransferToken();
  const { data, error } = await admin
    .from('advance_transfer_tokens')
    .insert({
      advance_request_id: requestId,
      token,
      expires_at: advanceTransferTokenExpiresAt().toISOString(),
    })
    .select('token, expires_at')
    .single();

  if (error) throw new AdvanceRequestError(error.message, 'DB', 500);
  return data;
}

export async function ensureTransferTokenForApprovedRequest(
  admin: SupabaseClient,
  requestId: string,
  projectId: string
) {
  const existing = await getActiveTransferToken(admin, requestId, projectId);
  if (existing) return existing;
  return regenerateTransferToken(admin, requestId, projectId);
}

export async function confirmCashAdvance(
  admin: SupabaseClient,
  params: { token: string; employeeId: string }
) {
  const normalized = normalizeAdvanceCashToken(params.token);
  if (!normalized) {
    throw new AdvanceRequestError(strings.invalidToken, 'INVALID_TOKEN');
  }

  const { data: tokenRow, error: tokenError } = await admin
    .from('advance_cash_tokens')
    .select('*, advance_requests(*)')
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (tokenError) {
    if (tokenError.message.includes('advance_cash_tokens')) {
      throw new AdvanceRequestError(strings.migrationHint, 'MIGRATION', 503);
    }
    throw new AdvanceRequestError(tokenError.message, 'DB', 500);
  }
  if (!tokenRow) throw new AdvanceRequestError(strings.tokenInvalidOrUsed, 'INVALID_TOKEN');

  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    await admin.from('advance_cash_tokens').update({ is_active: false }).eq('id', tokenRow.id);
    await admin
      .from('advance_requests')
      .update({ status: 'expired' })
      .eq('id', tokenRow.advance_request_id)
      .eq('status', 'awaiting_receipt');
    throw new AdvanceRequestError(strings.tokenExpired, 'EXPIRED');
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
    throw new AdvanceRequestError(strings.tokenNotYours, 'FORBIDDEN', 403);
  }
  if (request.status !== 'awaiting_receipt' || request.payment_method !== 'cash') {
    throw new AdvanceRequestError(strings.cashNotAwaiting, 'INVALID_STATUS');
  }

  const amount = request.approved_amount ?? request.requested_amount;
  const payDate = dayjs().format('YYYY-MM-DD');
  const deductionId = await insertDeduction(admin, {
    projectId: request.project_id,
    employeeId: request.employee_id,
    amount,
    date: payDate,
    description: formatString(strings.deductionDescriptionCash, {
      requestIdPrefix: request.id.slice(0, 8),
    }),
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

  try {
    await notifyAdvancePaid(admin, {
      employeeId: request.employee_id,
      projectId: request.project_id,
      requestId: request.id,
      amount,
    });
  } catch {
    /* bildirim isteğe bağlı */
  }

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
    throw new AdvanceRequestError(strings.cashQrAwaitingOnly, 'INVALID_STATUS');
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
