import { validateDekontDocument, validateMatchForConfirm, formatDekontValidationFailure, buildDekontScanReport, isDekontReviewable } from '@/lib/dekont-validation';
import type { DekontScanReport } from '@/lib/dekont-scan-report';
import { analyzeDekont, type DekontOcrResult } from '@/lib/dekont-ocr';
import { buildEnrichedOcrResult } from '@/lib/dekont-ocr-enrich';
import { isDraftPendingOcr } from '@/lib/dekont-ocr-shared';
import { suggestAdvanceMatches, type DekontMatchSuggestion } from '@/lib/advance-dekont-match';
import {
  assertDekontFile,
  downloadAdvanceDekont,
  getStorageBackend,
  uploadAdvanceDekont,
} from '@/lib/advance-external-storage';
import { recordBankPayment, AdvanceRequestError } from '@/lib/advance-request-service';
import strings from '@json/src/lib/dekont-import-service.json';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const DRAFT_TTL_MINUTES = 30;

function pendingOcrPlaceholder(): DekontOcrResult {
  return {
    rawText: '',
    recipientIban: null,
    senderIban: null,
    allIbans: [],
    amount: null,
    referenceNo: null,
    paymentDate: null,
    senderBank: null,
    recipientBank: null,
    transferType: null,
    confidence: 'low',
    source: 'none',
    processing: true,
  };
}

export class DekontImportError extends Error {
  constructor(
    message: string,
    public status = 400,
    public report?: DekontScanReport
  ) {
    super(message);
  }
}

async function listAccessibleProjectIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('projects').select('id').order('name');
  if (error) throw new DekontImportError(error.message, 500);
  return (data ?? []).map((p) => p.id);
}

/** Banka paylaşımı — dosyayı hızlı kaydet, OCR'ı sonraya bırak (TWA beyaz ekran önleme). */
export async function stageDekontShare(params: {
  adminUserId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  assertDekontFile(params.mimeType, params.buffer.length);

  const admin = createAdminClient();
  const projectIds = await listAccessibleProjectIds();
  if (projectIds.length === 0) {
    throw new DekontImportError(strings.noAccessibleProject, 403);
  }

  const projectId = projectIds[0]!;
  const tempRequestId = crypto.randomUUID();
  const proof = await uploadAdvanceDekont({
    buffer: params.buffer,
    fileName: params.fileName,
    mimeType: params.mimeType,
    projectId,
    requestId: `share-${tempRequestId.slice(0, 8)}`,
    backend: getStorageBackend(),
  });

  const expiresAt = new Date(Date.now() + DRAFT_TTL_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('dekont_import_drafts')
    .insert({
      admin_user_id: params.adminUserId,
      project_id: projectId,
      proof_storage_backend: proof.backend,
      proof_external_id: proof.externalId,
      proof_file_name: params.fileName,
      proof_mime_type: params.mimeType,
      ocr_json: pendingOcrPlaceholder(),
      match_json: [],
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error) {
    if (error.message.includes('dekont_import_drafts')) {
      throw new DekontImportError(strings.runMigration, 503);
    }
    throw new DekontImportError(error.message, 500);
  }

  return { draftId: data.id as string };
}

async function finalizeDraftOcr(
  adminUserId: string,
  draftId: string,
  row: Record<string, unknown>,
  ocr: DekontOcrResult
) {
  const admin = createAdminClient();
  const validation = validateDekontDocument(ocr);
  if (!validation.accepted && !isDekontReviewable(ocr)) {
    const report = buildDekontScanReport(validation, ocr);
    throw new DekontImportError(formatDekontValidationFailure(validation, ocr), 422, report);
  }

  const projectIds = await listAccessibleProjectIds();
  const matches = await suggestAdvanceMatches(admin, { projectIds, ocr });
  const top = matches[0];
  const projectId = top?.projectId ?? (row.project_id as string | null);

  const { error: updateError } = await admin
    .from('dekont_import_drafts')
    .update({
      ocr_json: ocr,
      match_json: matches,
      project_id: projectId,
      advance_request_id: top?.requestId ?? null,
    })
    .eq('id', draftId)
    .eq('admin_user_id', adminUserId);

  if (updateError) throw new DekontImportError(updateError.message, 500);

  return {
    draft: {
      id: draftId,
      ocr_json: ocr,
      match_json: matches,
      proof_file_name: row.proof_file_name as string,
    },
    ocr,
    matches,
    validation,
  };
}

/** İstemci OCR sonucunu kaydet — sunucuda Tesseract çalıştırmaz (Vercel Hobby uyumlu). */
export async function applyOcrToDraft(
  adminUserId: string,
  draftId: string,
  rawText: string,
  source: DekontOcrResult['source'] = 'tesseract'
) {
  const admin = createAdminClient();
  const { data: row, error: loadError } = await admin
    .from('dekont_import_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('admin_user_id', adminUserId)
    .maybeSingle();

  if (loadError) throw new DekontImportError(loadError.message, 500);
  if (!row) throw new DekontImportError(strings.draftNotFound, 404);
  if (row.consumed_at) throw new DekontImportError(strings.draftAlreadyUsed, 410);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new DekontImportError(strings.draftExpired, 410);
  }

  const existingOcr = row.ocr_json as DekontOcrResult;
  if (!isDraftPendingOcr(existingOcr)) {
    return {
      draft: {
        id: row.id as string,
        ocr_json: existingOcr,
        match_json: (row.match_json ?? []) as DekontMatchSuggestion[],
        proof_file_name: row.proof_file_name as string,
      },
      ocr: existingOcr,
      matches: (row.match_json ?? []) as DekontMatchSuggestion[],
      validation: validateDekontDocument(existingOcr),
    };
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new DekontImportError(strings.ocrTextEmpty, 422);
  }

  const ocr = await buildEnrichedOcrResult(trimmed, source);
  return finalizeDraftOcr(adminUserId, draftId, row, ocr);
}

/** İstemci OCR yetersizse sunucuda Vision + LLM ile yeniden işle */
export async function reprocessDekontDraftWithServerOcr(adminUserId: string, draftId: string) {
  return processDekontDraft(adminUserId, draftId, { allowReviewable: true });
}

export async function getDraftProofFile(adminUserId: string, draftId: string) {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('dekont_import_drafts')
    .select('proof_storage_backend, proof_external_id, proof_file_name, proof_mime_type, consumed_at, expires_at')
    .eq('id', draftId)
    .eq('admin_user_id', adminUserId)
    .maybeSingle();

  if (error) throw new DekontImportError(error.message, 500);
  if (!row) throw new DekontImportError(strings.draftNotFound, 404);
  if (row.consumed_at) throw new DekontImportError(strings.draftAlreadyUsed, 410);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new DekontImportError(strings.draftExpired, 410);
  }
  if (!row.proof_external_id || !row.proof_storage_backend) {
    throw new DekontImportError(strings.proofFileNotFound, 500);
  }

  const buffer = await downloadAdvanceDekont({
    backend: row.proof_storage_backend as 'google_drive' | 'r2',
    externalId: row.proof_external_id as string,
  });

  return {
    buffer,
    fileName: row.proof_file_name as string,
    mimeType: row.proof_mime_type as string,
  };
}

export async function processDekontDraft(
  adminUserId: string,
  draftId: string,
  options?: { allowReviewable?: boolean }
) {
  const admin = createAdminClient();
  const { data: row, error: loadError } = await admin
    .from('dekont_import_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('admin_user_id', adminUserId)
    .maybeSingle();

  if (loadError) throw new DekontImportError(loadError.message, 500);
  if (!row) throw new DekontImportError(strings.draftNotFound, 404);
  if (row.consumed_at) throw new DekontImportError(strings.draftAlreadyUsed, 410);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new DekontImportError(strings.draftExpired, 410);
  }

  const existingOcr = row.ocr_json as DekontOcrResult;
  if (!isDraftPendingOcr(existingOcr)) {
    return {
      draft: {
        id: row.id as string,
        ocr_json: existingOcr,
        match_json: (row.match_json ?? []) as DekontMatchSuggestion[],
        proof_file_name: row.proof_file_name as string,
      },
      ocr: existingOcr,
      matches: (row.match_json ?? []) as DekontMatchSuggestion[],
      validation: validateDekontDocument(existingOcr),
    };
  }

  if (!row.proof_external_id || !row.proof_storage_backend) {
    throw new DekontImportError(strings.proofFileNotFound, 500);
  }

  const buffer = await downloadAdvanceDekont({
    backend: row.proof_storage_backend as 'google_drive' | 'r2',
    externalId: row.proof_external_id as string,
  });

  let ocr: DekontOcrResult;
  try {
    ocr = await analyzeDekont({
      buffer,
      mimeType: row.proof_mime_type as string,
    });
  } catch (err) {
    ocr = {
      rawText: '',
      recipientIban: null,
      senderIban: null,
      allIbans: [],
      amount: null,
      referenceNo: null,
      paymentDate: null,
      senderBank: null,
      recipientBank: null,
      transferType: null,
      confidence: 'low',
      source: 'none',
      ocrError: err instanceof Error ? err.message : null,
    };
    if (err instanceof Error && err.message.includes('Vision')) {
      throw new DekontImportError(err.message, 503);
    }
  }

  const validation = validateDekontDocument(ocr);
  const reviewable = isDekontReviewable(ocr);
  if (!validation.accepted && !(options?.allowReviewable && reviewable)) {
    const report = buildDekontScanReport(validation, ocr);
    throw new DekontImportError(formatDekontValidationFailure(validation, ocr), 422, report);
  }

  return finalizeDraftOcr(adminUserId, draftId, row, ocr);
}

export async function ingestDekontDraft(params: {
  adminUserId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  preferredProjectId?: string | null;
}) {
  assertDekontFile(params.mimeType, params.buffer.length);

  const admin = createAdminClient();
  const projectIds = await listAccessibleProjectIds();
  if (projectIds.length === 0) {
    throw new DekontImportError(strings.noAccessibleProject, 403);
  }

  let ocr: DekontOcrResult;
  try {
    ocr = await analyzeDekont({ buffer: params.buffer, mimeType: params.mimeType });
  } catch (err) {
    ocr = {
      rawText: '',
      recipientIban: null,
      senderIban: null,
      allIbans: [],
      amount: null,
      referenceNo: null,
      paymentDate: null,
      senderBank: null,
      recipientBank: null,
      transferType: null,
      confidence: 'low',
      source: 'none',
    };
    if (err instanceof Error && err.message.includes('Vision')) {
      throw new DekontImportError(err.message, 503);
    }
  }

  const validation = validateDekontDocument(ocr);
  if (!validation.accepted && !isDekontReviewable(ocr)) {
    const report = buildDekontScanReport(validation, ocr);
    throw new DekontImportError(formatDekontValidationFailure(validation, ocr), 422, report);
  }

  const matches = await suggestAdvanceMatches(admin, { projectIds, ocr });
  const top = matches[0];
  const projectId =
    params.preferredProjectId && projectIds.includes(params.preferredProjectId)
      ? params.preferredProjectId
      : top?.projectId ?? null;

  const tempRequestId = top?.requestId ?? crypto.randomUUID();
  const proof = await uploadAdvanceDekont({
    buffer: params.buffer,
    fileName: params.fileName,
    mimeType: params.mimeType,
    projectId: projectId ?? projectIds[0]!,
    requestId: `draft-${tempRequestId.slice(0, 8)}`,
    backend: getStorageBackend(),
  });

  const expiresAt = new Date(Date.now() + DRAFT_TTL_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('dekont_import_drafts')
    .insert({
      admin_user_id: params.adminUserId,
      project_id: projectId,
      advance_request_id: top?.requestId ?? null,
      proof_storage_backend: proof.backend,
      proof_external_id: proof.externalId,
      proof_file_name: params.fileName,
      proof_mime_type: params.mimeType,
      ocr_json: ocr,
      match_json: matches,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error) {
    if (error.message.includes('dekont_import_drafts')) {
      throw new DekontImportError(strings.runMigration, 503);
    }
    throw new DekontImportError(error.message, 500);
  }

  return { draftId: data.id as string, ocr, matches, validation };
}

export async function loadDekontDraft(adminUserId: string, draftId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('dekont_import_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('admin_user_id', adminUserId)
    .maybeSingle();

  if (error) throw new DekontImportError(error.message, 500);
  if (!data) throw new DekontImportError(strings.draftNotFound, 404);
  if (data.consumed_at) throw new DekontImportError(strings.draftAlreadyUsed, 410);
  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new DekontImportError(strings.draftExpired, 410);
  }

  return data as {
    id: string;
    project_id: string | null;
    advance_request_id: string | null;
    proof_file_name: string;
    proof_mime_type: string;
    ocr_json: DekontOcrResult;
    match_json: DekontMatchSuggestion[];
  };
}

export async function confirmDekontDraft(params: {
  adminUserId: string;
  draftId: string;
  requestId: string;
  projectId: string;
  referenceNo?: string;
  paymentDate?: string;
  amount?: number;
}) {
  const draft = await loadDekontDraft(params.adminUserId, params.draftId);
  const admin = createAdminClient();

  const ocrForConfirm: DekontOcrResult =
    params.amount != null && params.amount > 0
      ? { ...draft.ocr_json, amount: params.amount }
      : draft.ocr_json;

  const selectedMatch =
    (draft.match_json ?? []).find((m) => m.requestId === params.requestId) ?? null;
  const matchCheck = validateMatchForConfirm(ocrForConfirm, selectedMatch);
  if (!matchCheck.ok) {
    throw new DekontImportError(matchCheck.reason ?? strings.matchValidationFailed, 422);
  }

  const { data: draftRow } = await admin
    .from('dekont_import_drafts')
    .select('proof_storage_backend, proof_external_id, proof_file_name, proof_mime_type, ocr_json')
    .eq('id', params.draftId)
    .single();

  if (!draftRow?.proof_external_id || !draftRow.proof_storage_backend) {
    throw new DekontImportError(strings.proofFileNotFound, 500);
  }

  const record = await recordBankPayment(admin, {
    projectId: params.projectId,
    requestId: params.requestId,
    paymentDate: params.paymentDate ?? draft.ocr_json.paymentDate ?? undefined,
    referenceNo: params.referenceNo ?? draft.ocr_json.referenceNo ?? undefined,
    fileName: draftRow.proof_file_name,
    mimeType: draftRow.proof_mime_type,
    actor: { id: params.adminUserId },
    existingProof: {
      backend: draftRow.proof_storage_backend as 'google_drive' | 'r2',
      externalId: draftRow.proof_external_id,
    },
    proofOcrJson: {
      ...(draftRow.ocr_json as Record<string, unknown>),
      ...(params.amount != null ? { amount: params.amount, amountManual: true } : {}),
    },
  });

  await admin
    .from('dekont_import_drafts')
    .update({ consumed_at: new Date().toISOString(), advance_request_id: params.requestId })
    .eq('id', params.draftId);

  return record;
}

export async function analyzeDekontOnly(params: {
  adminUserId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  projectId?: string | null;
}) {
  return ingestDekontDraft({
    adminUserId: params.adminUserId,
    buffer: params.buffer,
    fileName: params.fileName,
    mimeType: params.mimeType,
    preferredProjectId: params.projectId,
  });
}

export { AdvanceRequestError };
