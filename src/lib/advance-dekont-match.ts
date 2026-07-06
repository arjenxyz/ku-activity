import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeIbanLookupHash,
  decryptField,
  maskIban,
  normalizeIban,
} from '@/lib/field-encryption';
import {
  normalizeAdvanceTransferToken,
  parseAdvanceTransferTokenFromText,
} from '@/lib/advance-transfer-token';
import type { DekontOcrResult } from '@/lib/dekont-ocr-shared';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/lib/advance-dekont-match.json';

export type DekontMatchSuggestion = {
  requestId: string;
  projectId: string;
  projectName: string | null;
  employeeId: string;
  employeeName: string;
  employeePhotoUrl: string | null;
  employeePosition: string | null;
  employeeIbanMasked: string | null;
  approvedAmount: number;
  approvedAt: string | null;
  score: number;
  reasons: string[];
  ibanMatched: boolean;
  amountMatched: boolean;
  transferTokenMatched: boolean;
  expectedTransferToken: string | null;
};

function amountClose(a: number, b: number, tolerance = 0.02) {
  if (a <= 0 || b <= 0) return false;
  return Math.abs(a - b) / b <= tolerance;
}

type AdvanceRow = {
  id: string;
  project_id: string;
  employee_id: string;
  approved_amount: number | null;
  requested_amount: number;
  approved_at: string | null;
  employees: { name?: string; photo_url?: string | null; position?: string | null } | null;
  projects: { name?: string } | null;
};

async function loadApprovedBankRequests(admin: SupabaseClient, projectIds: string[]) {
  if (projectIds.length === 0) return [];

  const { data, error } = await admin
    .from('advance_requests')
    .select(
      'id, project_id, employee_id, approved_amount, requested_amount, approved_at, employees(name, photo_url, position), projects(name)'
    )
    .in('project_id', projectIds)
    .eq('status', 'approved')
    .eq('payment_method', 'bank_transfer')
    .order('approved_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdvanceRow[];
}

async function loadRequestByTransferToken(admin: SupabaseClient, token: string) {
  const normalized = normalizeAdvanceTransferToken(token);
  if (!normalized) return null;

  const { data, error } = await admin
    .from('advance_transfer_tokens')
    .select(
      'token, advance_requests(id, project_id, employee_id, approved_amount, requested_amount, approved_at, status, payment_method, employees(name, photo_url, position), projects(name))'
    )
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.advance_requests) return null;

  const raw = data.advance_requests;
  const row = (Array.isArray(raw) ? raw[0] : raw) as (AdvanceRow & {
    status: string;
    payment_method: string | null;
  }) | null;
  if (!row || row.status !== 'approved' || row.payment_method !== 'bank_transfer') return null;
  return { token: data.token as string, row };
}

async function loadActiveTokensForRequests(admin: SupabaseClient, requestIds: string[]) {
  if (requestIds.length === 0) return new Map<string, string>();

  const { data, error } = await admin
    .from('advance_transfer_tokens')
    .select('advance_request_id, token')
    .in('advance_request_id', requestIds)
    .eq('is_active', true);

  if (error) throw new Error(error.message);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.advance_request_id as string, row.token as string);
  }
  return map;
}

async function employeeIbanInfo(admin: SupabaseClient, employeeId: string) {
  const { data } = await admin
    .from('employee_sensitive_data')
    .select('iban_enc')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!data?.iban_enc) return { hash: null, masked: null };
  try {
    const iban = decryptField(data.iban_enc);
    return {
      hash: computeIbanLookupHash(iban),
      masked: maskIban(iban),
    };
  } catch {
    return { hash: null, masked: null };
  }
}

function ocrTransferToken(ocr: DekontOcrResult): string | null {
  return (
    ocr.transferToken ??
    parseAdvanceTransferTokenFromText(ocr.rawText)
  );
}

function buildSuggestionForRow(
  row: AdvanceRow,
  params: {
    ocr: DekontOcrResult;
    ibanHash: string | null;
    employeeIbanCache: Map<string, { hash: string | null; masked: string | null }>;
    expectedToken: string | null;
    ocrToken: string | null;
    forceTokenMatch?: boolean;
  }
): DekontMatchSuggestion | null {
  const approvedAmount = Number(row.approved_amount ?? row.requested_amount);
  const reasons: string[] = [];
  let score = 0;
  let ibanMatched = false;
  let amountMatched = false;

  const normalizedExpected = params.expectedToken
    ? normalizeAdvanceTransferToken(params.expectedToken)
    : null;
  const transferTokenMatched = Boolean(
    params.ocrToken && normalizedExpected && params.ocrToken === normalizedExpected
  );

  if (transferTokenMatched) {
    score += 100;
    reasons.push(strings.reasons.transferTokenMatch);
  } else if (params.forceTokenMatch) {
    return null;
  }

  if (params.ibanHash) {
    const employeeIban = params.employeeIbanCache.get(row.employee_id);
    if (employeeIban?.hash && employeeIban.hash === params.ibanHash) {
      score += 50;
      ibanMatched = true;
      reasons.push(strings.reasons.ibanMatch);
    }
  }

  if (params.ocr.amount != null && amountClose(params.ocr.amount, approvedAmount)) {
    score += 35;
    amountMatched = true;
    reasons.push(
      formatString(strings.reasons.amountMatch, {
        ocrAmount: params.ocr.amount,
        approvedAmount,
      })
    );
  } else if (params.ocr.amount != null) {
    const diff = Math.abs(params.ocr.amount - approvedAmount);
    if (diff <= 50) {
      score += 15;
      reasons.push(strings.reasons.amountClose);
    }
  }

  if (params.ocr.referenceNo) {
    score += 5;
    reasons.push(strings.reasons.referenceRead);
  }

  const employeeCountForIban =
    params.ibanHash &&
    [...params.employeeIbanCache.entries()].filter(([, info]) => info.hash === params.ibanHash)
      .length === 1;
  if (employeeCountForIban) {
    score += 10;
    reasons.push(strings.reasons.singleCandidate);
  }

  if (score <= 0) return null;

  const employees = row.employees;
  const projects = row.projects;
  const ibanInfo = params.employeeIbanCache.get(row.employee_id);

  return {
    requestId: row.id,
    projectId: row.project_id,
    projectName: projects?.name ?? null,
    employeeId: row.employee_id,
    employeeName: employees?.name ?? strings.employeeFallback,
    employeePhotoUrl: employees?.photo_url ?? null,
    employeePosition: employees?.position ?? null,
    employeeIbanMasked: ibanInfo?.masked ?? null,
    approvedAmount,
    approvedAt: row.approved_at,
    score,
    reasons,
    ibanMatched,
    amountMatched,
    transferTokenMatched,
    expectedTransferToken: normalizedExpected,
  };
}

export async function suggestAdvanceMatches(
  admin: SupabaseClient,
  params: {
    projectIds: string[];
    ocr: DekontOcrResult;
  }
): Promise<DekontMatchSuggestion[]> {
  const ocrToken = ocrTransferToken(params.ocr);
  const tokenHit = ocrToken ? await loadRequestByTransferToken(admin, ocrToken) : null;

  let requests = await loadApprovedBankRequests(admin, params.projectIds);

  if (tokenHit && !requests.some((r) => r.id === tokenHit.row.id)) {
    if (params.projectIds.includes(tokenHit.row.project_id)) {
      requests = [tokenHit.row, ...requests];
    }
  }

  if (requests.length === 0) return [];

  const ibanHash = params.ocr.recipientIban
    ? computeIbanLookupHash(params.ocr.recipientIban)
    : null;

  const employeeIbanCache = new Map<string, { hash: string | null; masked: string | null }>();
  for (const row of requests) {
    if (!employeeIbanCache.has(row.employee_id)) {
      employeeIbanCache.set(row.employee_id, await employeeIbanInfo(admin, row.employee_id));
    }
  }

  const tokenMap = await loadActiveTokensForRequests(
    admin,
    requests.map((r) => r.id)
  );

  const suggestions: DekontMatchSuggestion[] = [];

  for (const row of requests) {
    const expectedToken = tokenMap.get(row.id) ?? null;
    const suggestion = buildSuggestionForRow(row, {
      ocr: params.ocr,
      ibanHash,
      employeeIbanCache,
      expectedToken,
      ocrToken,
      forceTokenMatch: Boolean(ocrToken && tokenHit && tokenHit.row.id === row.id),
    });
    if (suggestion) suggestions.push(suggestion);
  }

  suggestions.sort((a, b) => b.score - a.score);

  const minScore = ocrToken && tokenHit ? 50 : 50;
  return suggestions.filter((s) => s.score >= minScore).slice(0, 5);
}

export function formatOcrIban(iban: string | null) {
  if (!iban) return strings.ibanEmpty;
  return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}
