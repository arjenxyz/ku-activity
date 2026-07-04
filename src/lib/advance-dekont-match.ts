import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeIbanLookupHash,
  decryptField,
  normalizeIban,
} from '@/lib/field-encryption';
import type { DekontOcrResult } from '@/lib/dekont-ocr';

export type DekontMatchSuggestion = {
  requestId: string;
  projectId: string;
  projectName: string | null;
  employeeId: string;
  employeeName: string;
  approvedAmount: number;
  score: number;
  reasons: string[];
};

function amountClose(a: number, b: number, tolerance = 0.02) {
  if (a <= 0 || b <= 0) return false;
  return Math.abs(a - b) / b <= tolerance;
}

async function loadApprovedBankRequests(admin: SupabaseClient, projectIds: string[]) {
  if (projectIds.length === 0) return [];

  const { data, error } = await admin
    .from('advance_requests')
    .select('id, project_id, employee_id, approved_amount, requested_amount, employees(name), projects(name)')
    .in('project_id', projectIds)
    .eq('status', 'approved')
    .eq('payment_method', 'bank_transfer')
    .order('approved_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function employeeIbanHash(admin: SupabaseClient, employeeId: string) {
  const { data } = await admin
    .from('employee_sensitive_data')
    .select('iban_enc')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (!data?.iban_enc) return null;
  try {
    const iban = decryptField(data.iban_enc);
    return computeIbanLookupHash(iban);
  } catch {
    return null;
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

  const employeeIbanCache = new Map<string, string | null>();
  const suggestions: DekontMatchSuggestion[] = [];

  for (const row of requests) {
    const approvedAmount = Number(row.approved_amount ?? row.requested_amount);
    const reasons: string[] = [];
    let score = 0;

    if (ibanHash) {
      if (!employeeIbanCache.has(row.employee_id)) {
        employeeIbanCache.set(row.employee_id, await employeeIbanHash(admin, row.employee_id));
      }
      const employeeHash = employeeIbanCache.get(row.employee_id);
      if (employeeHash && employeeHash === ibanHash) {
        score += 50;
        reasons.push('Alıcı IBAN personel kaydıyla eşleşti');
      }
    }

    if (params.ocr.amount != null && amountClose(params.ocr.amount, approvedAmount)) {
      score += 35;
      reasons.push(`Tutar uyumlu (${params.ocr.amount} ≈ ${approvedAmount})`);
    } else if (params.ocr.amount != null) {
      const diff = Math.abs(params.ocr.amount - approvedAmount);
      if (diff <= 50) {
        score += 15;
        reasons.push('Tutar yakın');
      }
    }

    if (params.ocr.referenceNo) {
      score += 5;
      reasons.push('Referans no okundu');
    }

    const employeeCountForIban =
      ibanHash &&
      [...employeeIbanCache.entries()].filter(([, h]) => h === ibanHash).length === 1;
    if (employeeCountForIban) {
      score += 10;
      reasons.push('Tek aday personel');
    }

    if (score <= 0) continue;

    const employees = row.employees as { name?: string } | null;
    const projects = row.projects as { name?: string } | null;

    suggestions.push({
      requestId: row.id,
      projectId: row.project_id,
      projectName: projects?.name ?? null,
      employeeId: row.employee_id,
      employeeName: employees?.name ?? 'Personel',
      approvedAmount,
      score,
      reasons,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.filter((s) => s.score >= 50).slice(0, 5);
}

export function formatOcrIban(iban: string | null) {
  if (!iban) return '—';
  return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}
