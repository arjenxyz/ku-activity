import { LOCALE_BCP47, LOCALES, type Locale } from '@/lib/i18n/locale';

/** Dil seçicide o dilde okunacak karşılama cümlesi. */
export const LOCALE_WELCOME_PHRASES: Record<Locale, string> = {
  tr: 'Merhaba, hoş geldiniz',
  en: 'Hello, welcome',
  zh: '你好，欢迎',
  hi: 'नमस्ते, स्वागत है',
  es: 'Hola, bienvenidos',
  fr: 'Bonjour, bienvenue',
  ar: 'مرحباً، أهلاً بك',
  bn: 'হ্যালো, স্বাগতম',
  pt: 'Olá, bem-vindo',
  ru: 'Здравствуйте, добро пожаловать',
  ur: 'سلام، خوش آمدید',
  id: 'Halo, selamat datang',
  de: 'Hallo, willkommen',
  ja: 'こんにちは、ようこそ',
  hu: 'Helló, üdvözöljük',
};

const SPEECH_LANG_TAGS: Record<Locale, string[]> = {
  tr: ['tr-TR', 'tr'],
  en: ['en-GB', 'en-US', 'en'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  hi: ['hi-IN', 'hi'],
  es: ['es-ES', 'es-MX', 'es'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  ar: ['ar-SA', 'ar-EG', 'ar'],
  bn: ['bn-BD', 'bn-IN', 'bn'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  ru: ['ru-RU', 'ru'],
  ur: ['ur-PK', 'ur-IN', 'ur'],
  id: ['id-ID', 'id'],
  de: ['de-DE', 'de'],
  ja: ['ja-JP', 'ja'],
  hu: ['hu-HU', 'hu'],
};

const WELCOME_AUDIO_SRC: Record<Locale, string> = Object.fromEntries(
  LOCALES.map((locale) => [locale, `/audio/locale-welcome/${locale}.mp3`])
) as Record<Locale, string>;

const HOVER_PREVIEW_DELAY_MS = 220;
const MIN_RESTART_GAP_MS = 120;

let activeLocale: Locale | null = null;
let playbackGeneration = 0;
let lastStartedAt = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let pendingHoverLocale: Locale | null = null;

/** Tek oynatıcı — aynı anda yalnızca bir ses. */
let sharedAudio: HTMLAudioElement | null = null;
const preloadedSrc = new Set<string>();

let voicesCache: SpeechSynthesisVoice[] | null = null;
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function normalizeLang(tag: string) {
  return tag.toLowerCase().replace('_', '-');
}

function getSharedAudio() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function clearHoverTimer() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
  pendingHoverLocale = null;
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([]);

  if (voicesCache?.length) return Promise.resolve(voicesCache);

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const synth = window.speechSynthesis;

      const collect = () => {
        const voices = synth.getVoices();
        if (voices.length) {
          voicesCache = voices;
          resolve(voices);
        }
      };

      collect();
      synth.addEventListener('voiceschanged', collect, { once: true });
      window.setTimeout(() => {
        voicesCache = synth.getVoices();
        resolve(voicesCache);
      }, 400);
    });
  }

  return voicesReadyPromise;
}

function pickVoice(voices: SpeechSynthesisVoice[], locale: Locale): SpeechSynthesisVoice | undefined {
  const tags = SPEECH_LANG_TAGS[locale];

  for (const tag of tags) {
    const exact = voices.find((voice) => normalizeLang(voice.lang) === normalizeLang(tag));
    if (exact) return exact;
  }

  for (const tag of tags) {
    const base = normalizeLang(tag).split('-')[0];
    const matches = voices.filter((voice) => normalizeLang(voice.lang).startsWith(base));
    if (!matches.length) continue;
    return matches.find((voice) => voice.default) ?? matches.find((voice) => voice.localService) ?? matches[0];
  }

  return undefined;
}

function stopSharedAudio() {
  const audio = sharedAudio;
  if (!audio) return;
  audio.pause();
  audio.onended = null;
  audio.onerror = null;
  audio.oncanplaythrough = null;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function speakWithTts(locale: Locale, generation: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const phrase = LOCALE_WELCOME_PHRASES[locale];
  if (!phrase) return;

  void loadVoices().then((voices) => {
    if (playbackGeneration !== generation || activeLocale !== locale) return;

    const utterance = new SpeechSynthesisUtterance(phrase);
    const voice = pickVoice(voices, locale);
    const tags = SPEECH_LANG_TAGS[locale];

    utterance.lang = voice?.lang ?? tags[0] ?? LOCALE_BCP47[locale];
    if (voice) utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (playbackGeneration === generation && activeLocale === locale) activeLocale = null;
    };
    utterance.onerror = () => {
      if (playbackGeneration === generation && activeLocale === locale) activeLocale = null;
    };

    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      if (playbackGeneration !== generation || activeLocale !== locale) return;
      window.speechSynthesis.speak(utterance);
    }, 40);
  });
}

function playLocaleAudio(locale: Locale, generation: number) {
  const audio = getSharedAudio();
  if (!audio) return;

  const src = WELCOME_AUDIO_SRC[locale];

  const startPlayback = () => {
    if (playbackGeneration !== generation || activeLocale !== locale) return;

    audio.currentTime = 0;
    void audio.play().catch((error) => {
      if (playbackGeneration !== generation || activeLocale !== locale) return;
      if (isAbortError(error)) return;
      stopSharedAudio();
      speakWithTts(locale, generation);
    });
  };

  audio.onended = () => {
    if (playbackGeneration === generation && activeLocale === locale) activeLocale = null;
  };
  audio.onerror = () => {
    if (playbackGeneration !== generation || activeLocale !== locale) return;
    stopSharedAudio();
    speakWithTts(locale, generation);
  };

  if (audio.src.endsWith(src) && preloadedSrc.has(src)) {
    stopSharedAudio();
    startPlayback();
    return;
  }

  stopSharedAudio();
  audio.src = src;

  const onReady = () => {
    audio.oncanplaythrough = null;
    preloadedSrc.add(src);
    startPlayback();
  };

  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    preloadedSrc.add(src);
    startPlayback();
    return;
  }

  audio.oncanplaythrough = onReady;
  audio.load();
}

function shouldSkipImmediateRestart(locale: Locale) {
  const now = Date.now();
  if (activeLocale === locale && now - lastStartedAt < MIN_RESTART_GAP_MS) return true;
  return false;
}

function startLocaleWelcome(locale: Locale) {
  if (typeof window === 'undefined') return;
  if (shouldSkipImmediateRestart(locale)) return;

  clearHoverTimer();
  playbackGeneration += 1;
  const generation = playbackGeneration;

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  stopSharedAudio();

  activeLocale = locale;
  lastStartedAt = Date.now();
  playLocaleAudio(locale, generation);
}

/** Masaüstü hover — kısa gecikmeyle tek ses oynatır. */
export function scheduleLocaleWelcomePreview(locale: Locale) {
  if (typeof window === 'undefined') return;
  if (pendingHoverLocale === locale && hoverTimer) return;

  clearHoverTimer();
  pendingHoverLocale = locale;
  hoverTimer = window.setTimeout(() => {
    hoverTimer = null;
    pendingHoverLocale = null;
    startLocaleWelcome(locale);
  }, HOVER_PREVIEW_DELAY_MS);
}

export function cancelLocaleWelcomePreview() {
  clearHoverTimer();
}

/** MP3 dosyalarını arka planda önbelleğe alır (15 ayrı Audio örneği açmaz). */
export function warmUpLocaleWelcomeSpeech() {
  if (typeof window === 'undefined') return;

  void loadVoices();
  getSharedAudio();

  for (const locale of LOCALES) {
    const src = WELCOME_AUDIO_SRC[locale];
    if (preloadedSrc.has(src)) continue;
    void fetch(src, { cache: 'force-cache' })
      .then(() => {
        preloadedSrc.add(src);
      })
      .catch(() => {});
  }
}

export function cancelLocaleWelcomeSpeech() {
  clearHoverTimer();
  playbackGeneration += 1;

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  stopSharedAudio();
  activeLocale = null;
}

export function speakLocaleWelcome(locale: Locale) {
  startLocaleWelcome(locale);
}
