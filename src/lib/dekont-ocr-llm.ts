import 'server-only';

import { validateTurkishIban, normalizeIban } from '@/lib/field-encryption';
import {
  getGoogleServiceAccountToken,
  isGoogleServiceAccountConfigured,
  parseGoogleServiceAccountJson,
} from '@/lib/google-service-account';

export type LlmDekontFields = {
  amount: number | null;
  recipientIban: string | null;
  paymentDate: string | null;
  referenceNo: string | null;
};

function parseLlmJson(text: string): LlmDekontFields | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const amountRaw = raw.amount ?? raw.tutar;
    let amount: number | null = null;
    if (typeof amountRaw === 'number' && amountRaw > 0) {
      amount = amountRaw;
    } else if (typeof amountRaw === 'string') {
      const n = Number(amountRaw.replace(/\./g, '').replace(',', '.'));
      if (Number.isFinite(n) && n > 0) amount = n;
    }

    let recipientIban: string | null = null;
    const ibanRaw = raw.recipientIban ?? raw.recipient_iban ?? raw.aliciIban ?? raw.alici_iban;
    if (typeof ibanRaw === 'string') {
      const compact = ibanRaw.replace(/\s/g, '').toUpperCase();
      if (validateTurkishIban(compact)) recipientIban = normalizeIban(compact);
    }

    let paymentDate: string | null = null;
    const dateRaw = raw.paymentDate ?? raw.payment_date ?? raw.tarih;
    if (typeof dateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      paymentDate = dateRaw;
    }

    let referenceNo: string | null = null;
    const refRaw = raw.referenceNo ?? raw.reference_no ?? raw.referans;
    if (typeof refRaw === 'string' && refRaw.trim().length >= 4) {
      referenceNo = refRaw.trim().slice(0, 32);
    }

    return { amount, recipientIban, paymentDate, referenceNo };
  } catch {
    return null;
  }
}

async function callGeminiWithApiKey(rawText: string, apiKey: string): Promise<LlmDekontFields | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Aşağıdaki Türk banka dekontu / havale metninden alanları çıkar. Sadece JSON döndür, başka metin yazma.
Şema: {"amount": number|null, "recipientIban": "TR..."|null, "paymentDate": "YYYY-MM-DD"|null, "referenceNo": string|null}
- amount: transfer/havale tutarı (TL), ondalık nokta ile (ör. 15000.50)
- recipientIban: alıcı IBAN (TR ile başlar)
- paymentDate: işlem tarihi ISO format
- referenceNo: referans / işlem numarası
Bulamazsan null kullan.

METİN:
${rawText.slice(0, 8000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) return null;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseLlmJson(text);
}

async function callGeminiWithServiceAccount(rawText: string): Promise<LlmDekontFields | null> {
  const sa = parseGoogleServiceAccountJson() as { project_id?: string };
  const projectId = sa.project_id ?? process.env.GOOGLE_CLOUD_PROJECT?.trim();
  if (!projectId) return null;

  const token = await getGoogleServiceAccountToken(['https://www.googleapis.com/auth/cloud-platform']);
  const region = process.env.GEMINI_VERTEX_REGION?.trim() || 'europe-west1';
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash-001';

  const res = await fetch(
    `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Türk banka dekontu metninden JSON çıkar: amount (number|null), recipientIban (string|null), paymentDate (YYYY-MM-DD|null), referenceNo (string|null). Sadece JSON.

${rawText.slice(0, 8000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!res.ok) return null;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseLlmJson(text);
}

export function isDekontLlmAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim()) || isGoogleServiceAccountConfigured();
}

/** Regex parse eksik kaldığında yapılandırılmış alan çıkarımı */
export async function extractDekontFieldsWithLlm(rawText: string): Promise<LlmDekontFields | null> {
  const trimmed = rawText.trim();
  if (trimmed.length < 20) return null;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey) {
    try {
      return await callGeminiWithApiKey(trimmed, apiKey);
    } catch {
      /* vertex fallback */
    }
  }

  if (!isGoogleServiceAccountConfigured()) return null;

  try {
    return await callGeminiWithServiceAccount(trimmed);
  } catch {
    return null;
  }
}
