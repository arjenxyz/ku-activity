import 'server-only';

import type { Locale } from '@/lib/i18n/locale';

export type SupportChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
}

export function isSupportChatConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export async function generateSupportChatReply(
  messages: SupportChatMessage[],
  locale: Locale
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('SUPPORT_CHAT_NOT_CONFIGURED');
  }

  const model = getGeminiModel();
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt(locale) }],
    },
    {
      role: 'model',
      parts: [{ text: 'Anladım. CrewLedger destek asistanı olarak yardımcı olmaya hazırım.' }],
    },
    ...messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 1024,
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

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GEMINI_ERROR:${res.status}:${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) {
    throw new Error('GEMINI_EMPTY');
  }

  return text;
}
