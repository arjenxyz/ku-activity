import { validateDekontDocument, validateMatchForConfirm } from '@/lib/dekont-validation';
import { analyzeDekont, type DekontOcrResult } from '@/lib/dekont-ocr';
import { suggestAdvanceMatches, type DekontMatchSuggestion } from '@/lib/advance-dekont-match';
import {
  assertDekontFile,
  getStorageBackend,
  uploadAdvanceDekont,
} from '@/lib/advance-external-storage';
import { recordBankPayment, AdvanceRequestError } from '@/lib/advance-request-service';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

const DRAFT_TTL_MINUTES = 30;

export class DekontImportError extends Error {
  constructor(
    message: string,
    public status = 400
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
    throw new DekontImportError('Erişilebilir proje bulunamadı', 403);
  }

  let ocr: DekontOcrResult;
  try {
    ocr = await analyzeDekont({ buffer: params.buffer, mimeType: params.mimeType });
  } catch (err) {
    ocr = {
      rawText: '',
      recipientIban: null,
      allIbans: [],
      amount: null,
      referenceNo: null,
      paymentDate: null,
      confidence: 'low',
      source: 'none',
    };
    if (err instanceof Error && err.message.includes('Vision')) {
      throw new DekontImportError(err.message, 503);
    }
  }

  const validation = validateDekontDocument(ocr);
  if (!validation.accepted) {
    const failed = validation.checks.filter((c) => c.required && !c.passed);
    const detail = failed.map((c) => c.label).join(', ');
    throw new DekontImportError(
      `${validation.summary}${detail ? ` (${detail})` : ''}`,
      422
    );
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
      throw new DekontImportError('057_dekont_import_drafts.sql çalıştırın', 503);
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
  if (!data) throw new DekontImportError('Taslak bulunamadı', 404);
  if (data.consumed_at) throw new DekontImportError('Bu taslak zaten kullanıldı', 410);
  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new DekontImportError('Taslak süresi doldu — dekontu yeniden paylaşın', 410);
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
}) {
  const draft = await loadDekontDraft(params.adminUserId, params.draftId);
  const admin = createAdminClient();

  const selectedMatch =
    (draft.match_json ?? []).find((m) => m.requestId === params.requestId) ?? null;
  const matchCheck = validateMatchForConfirm(draft.ocr_json, selectedMatch);
  if (!matchCheck.ok) {
    throw new DekontImportError(matchCheck.reason ?? 'Eşleşme doğrulanamadı', 422);
  }

  const { data: draftRow } = await admin
    .from('dekont_import_drafts')
    .select('proof_storage_backend, proof_external_id, proof_file_name, proof_mime_type, ocr_json')
    .eq('id', params.draftId)
    .single();

  if (!draftRow?.proof_external_id || !draftRow.proof_storage_backend) {
    throw new DekontImportError('Dekont dosyası bulunamadı', 500);
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
    proofOcrJson: draftRow.ocr_json as Record<string, unknown>,
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
