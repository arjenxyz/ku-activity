import type { DekontValidationCheck } from '@/lib/dekont-validation';

export type DekontScanReport = {
  summary: string;
  score: number;
  accepted: boolean;
  checks: DekontValidationCheck[];
  ocrPreview?: {
    charCount: number;
    iban: string | null;
    amount: number | null;
    source: string | null;
    ocrError?: string | null;
  };
};

function utf8BytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64ToUtf8String(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function encodeScanReport(report: DekontScanReport): string {
  const json = JSON.stringify(report);
  return utf8BytesToBase64(new TextEncoder().encode(json));
}

export function decodeScanReport(encoded: string | null | undefined): DekontScanReport | null {
  if (!encoded) return null;
  try {
    const json = base64ToUtf8String(encoded);
    const data = JSON.parse(json) as DekontScanReport;
    if (!data || !Array.isArray(data.checks)) return null;
    return data;
  } catch {
    return null;
  }
}
