import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeIbanLookupHash,
  decryptField,
  maskIban,
  normalizeIban,
} from '@/lib/field-encryption';
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
};

function amountClose(a: number, b: number, tolerance = 0.02) {
  if (a <= 0 || b <= 0) return false;
  return Math.abs(a - b) / b <= tolerance;
}

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
  return data ?? [];
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

export async function suggestAdvanceMatches(
  admin: SupabaseClient,
  params: {
    projectIds: string[];
    ocr: DekontOcrResult;
  }
): Promise<DekontMatchSuggestion[]> {
  const requests = await loadApprovedBankRequests(admin, params.projectIds);
  if (requests.length === 0) return [];

  const ibanHash = params.ocr.recipientIban
    ? computeIbanLookupHash(params.ocr.recipientIban)
    : null;

  const employeeIbanCache = new Map<string, { hash: string | null; masked: string | null }>();
  const suggestions: DekontMatchSuggestion[] = [];

  for (const row of requests) {
    const approvedAmount = Number(row.approved_amount ?? row.requested_amount);
    const reasons: string[] = [];
    let score = 0;
    let ibanMatched = false;
    let amountMatched = false;

    if (ibanHash) {
      if (!employeeIbanCache.has(row.employee_id)) {
        employeeIbanCache.set(row.employee_id, await employeeIbanInfo(admin, row.employee_id));
      }
      const employeeIban = employeeIbanCache.get(row.employee_id)!;
      if (employeeIban.hash && employeeIban.hash === ibanHash) {
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
      ibanHash &&
      [...employeeIbanCache.entries()].filter(([, info]) => info.hash === ibanHash).length === 1;
    if (employeeCountForIban) {
      score += 10;
      reasons.push(strings.reasons.singleCandidate);
    }

    if (score <= 0) continue;

    const employees = row.employees as { name?: string; photo_url?: string | null; position?: string | null } | null;
    const projects = row.projects as { name?: string } | null;
    const ibanInfo = employeeIbanCache.get(row.employee_id);

    suggestions.push({
      requestId: row.id,
      projectId: row.project_id,
      projectName: projects?.name ?? null,
      employeeId: row.employee_id,
      employeeName: employees?.name ?? strings.employeeFallback,
      employeePhotoUrl: employees?.photo_url ?? null,
      employeePosition: employees?.position ?? null,
      employeeIbanMasked: ibanInfo?.masked ?? null,
      approvedAmount,
      approvedAt: (row.approved_at as string | null) ?? null,
      score,
      reasons,
      ibanMatched,
      amountMatched,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.filter((s) => s.score >= 50).slice(0, 5);
}

export function formatOcrIban(iban: string | null) {
  if (!iban) return strings.ibanEmpty;
  return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}
