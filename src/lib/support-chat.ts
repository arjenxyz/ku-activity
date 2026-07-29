import 'server-only';

import type { Locale } from '@/lib/i18n/locale';

export type SupportChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SupportChatErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTH'
  | 'QUOTA'
  | 'MODEL'
  | 'UNAVAILABLE'
  | 'EMPTY'
  | 'UPSTREAM';

export class SupportChatError extends Error {
  readonly code: SupportChatErrorCode;
  readonly status?: number;

  constructor(code: SupportChatErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'SupportChatError';
    this.code = code;
    this.status = status;
  }
}

const CREWLEDGER_KNOWLEDGE = `
CrewLedger — inşaat sahası personel yönetimi platformu.

Uygulamalar:
- Personel uygulaması: QR yoklama, yevmiye onayı, avans talebi, bordro görüntüleme, mesai takibi.
- Yönetici (admin) uygulaması: proje/şantiye yönetimi, personel kayıtları, puantaj, avans onayı, bordro.

Öne çıkan özellikler:
- QR kod ile yoklama: Personel şantiyedeki QR'ı okutarak giriş/çıkış yapar.
- Çoklu proje: Her şantiye ayrı proje olarak yönetilir.
- Bordro: Brüt, mesai, avans, kesinti ve net maaş hesaplaması.
- Avans: Personel talep eder, yönetici onaylar; dekont yükleme desteklenir.
- Demo: Siteden "Ücretsiz Demoyu Dene" ile personel paneli demosu açılabilir (/personnel-panel/demo).
- İndirme: Google Play veya /apk sayfasından APK indirme.
- Destek e-postası ve WhatsApp footer'da mevcut.

Güvenlik: SSL, KVKK uyumu, veriler güvenli sunucularda.

Yanıt kuralları:
- Kısa, net, adım adım ve nazik ol.
- Bilmediğin teknik detay uydurma; emin değilsen destek kanallarına yönlendir.
- Türk inşaat sektörü terminolojisine uygun konuş (usta, yevmiye, şantiye, puantaj).
`.trim();

/** Free-tier friendly defaults; 2.0 Flash was shut down June 2026. */
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'] as const;

function systemPrompt(locale: Locale): string {
  const languageHint =
    locale === 'tr'
      ? 'Varsayılan dil Türkçe. Kullanıcı başka dilde yazarsa o dilde yanıt ver.'
      : `Respond in the user's language. Preferred locale code: ${locale}.`;

  return `You are CrewLedger's helpful support assistant.

${languageHint}

${CREWLEDGER_KNOWLEDGE}`;
}

function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  return key || null;
}

function getPreferredModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function modelCandidates(): string[] {
  const preferred = getPreferredModel();
  const seen = new Set<string>();
  const list: string[] = [];
  for (const model of [preferred, DEFAULT_MODEL, ...FALLBACK_MODELS]) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    list.push(model);
  }
  return list;
}

export function isSupportChatConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

function mapGeminiHttpError(status: number, detail: string): SupportChatError {
  const snippet = detail.slice(0, 240);
  if (status === 400 && /API key|api_key|invalid/i.test(detail)) {
    return new SupportChatError('AUTH', `GEMINI_ERROR:${status}:${snippet}`, status);
  }
  if (status === 401 || status === 403) {
    return new SupportChatError('AUTH', `GEMINI_ERROR:${status}:${snippet}`, status);
  }
  if (status === 429) {
    return new SupportChatError('QUOTA', `GEMINI_ERROR:${status}:${snippet}`, status);
  }
  if (status === 404) {
    return new SupportChatError('MODEL', `GEMINI_ERROR:${status}:${snippet}`, status);
  }
  if (status === 503 || status === 500) {
    return new SupportChatError('UNAVAILABLE', `GEMINI_ERROR:${status}:${snippet}`, status);
  }
  return new SupportChatError('UPSTREAM', `GEMINI_ERROR:${status}:${snippet}`, status);
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number; status?: string };
};

async function callGeminiGenerateContent(
  apiKey: string,
  model: string,
  messages: SupportChatMessage[],
  locale: Locale
): Promise<string> {
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt(locale) }],
        },
        contents,
        generationConfig: {
          temperature: 0.55,
          // Flash 3.x may reserve thinking tokens from the same budget.
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    }
  );

  const raw = await res.text().catch(() => '');
  let data: GeminiGenerateResponse | null = null;
  try {
    data = raw ? (JSON.parse(raw) as GeminiGenerateResponse) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw mapGeminiHttpError(res.status, raw || data?.error?.message || '');
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) {
    throw new SupportChatError('EMPTY', 'GEMINI_EMPTY', res.status);
  }

  return text;
}

export async function generateSupportChatReply(
  messages: SupportChatMessage[],
  locale: Locale
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new SupportChatError('NOT_CONFIGURED', 'SUPPORT_CHAT_NOT_CONFIGURED');
  }

  const models = modelCandidates();
  let lastError: SupportChatError | null = null;

  for (const model of models) {
    try {
      return await callGeminiGenerateContent(apiKey, model, messages, locale);
    } catch (err) {
      if (err instanceof SupportChatError) {
        lastError = err;
        // Retry next model when this one is missing / overloaded / empty.
        if (err.code === 'MODEL' || err.code === 'UNAVAILABLE' || err.code === 'EMPTY') {
          continue;
        }
        throw err;
      }
      throw err;
    }
  }

  throw lastError ?? new SupportChatError('UPSTREAM', 'GEMINI_ERROR:unknown');
}
