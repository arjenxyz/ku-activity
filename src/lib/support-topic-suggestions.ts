/** Destek sohbeti öneri chip'leri — sabit konu bankası (AI serbest soru üretmez). */

export type SupportTopicKey =
  | 'attendance'
  | 'advance'
  | 'payroll'
  | 'login'
  | 'demo'
  | 'download'
  | 'bug'
  | 'default';

type TopicBank = Record<SupportTopicKey, string[]>;

const TOPIC_KEYWORDS: Array<{ topic: SupportTopicKey; patterns: RegExp[] }> = [
  {
    topic: 'attendance',
    patterns: [/yoklama/i, /qr/i, /attendance/i, /puantaj/i, /giriş.?çıkış/i, /check.?in/i],
  },
  {
    topic: 'advance',
    patterns: [/avans/i, /advance/i, /nakit/i, /ödeme talebi/i],
  },
  {
    topic: 'payroll',
    patterns: [/bordro/i, /maaş/i, /payroll/i, /yevmiye/i, /mesai/i, /salary/i, /wage/i],
  },
  {
    topic: 'login',
    patterns: [/giriş/i, /login/i, /şifre/i, /password/i, /panel/i, /auth/i],
  },
  {
    topic: 'demo',
    patterns: [/demo/i, /deneme/i, /ücretsiz/i, /free trial/i],
  },
  {
    topic: 'download',
    patterns: [/apk/i, /indir/i, /download/i, /play store/i, /google play/i, /uygulama/i],
  },
  {
    topic: 'bug',
    patterns: [/hata/i, /bug/i, /çalışmıyor/i, /broken/i, /error/i, /sorun/i, /\/bug-report/i],
  },
];

export function detectSupportTopic(text: string): SupportTopicKey {
  const sample = text.trim();
  if (!sample) return 'default';
  for (const entry of TOPIC_KEYWORDS) {
    if (entry.patterns.some((re) => re.test(sample))) return entry.topic;
  }
  return 'default';
}

export function resolveTopicSuggestions(
  bank: Partial<TopicBank> | undefined,
  fallback: string[],
  ...texts: string[]
): string[] {
  const joined = texts.filter(Boolean).join('\n');
  const topic = detectSupportTopic(joined);
  const fromBank = bank?.[topic] ?? bank?.default ?? fallback;
  return (fromBank.length ? fromBank : fallback).slice(0, 4);
}
