/** Uygulama içi bildirim sesleri — `/bip.mp3` + `/public/sounds/notify-*.wav` */

import {
  getNotificationSoundId,
  isNotificationSoundEnabled,
  isNotificationsMuted,
  type NotificationSoundId,
} from '@/lib/personnel-notification-storage';

export const NOTIFICATION_SOUND_OPTIONS: {
  id: NotificationSoundId;
  src: string;
}[] = [
  { id: 'default', src: '/bip.mp3' },
  { id: 'classic', src: '/sounds/notify-classic.wav' },
  { id: 'ping', src: '/sounds/notify-ping.wav' },
  { id: 'chime', src: '/sounds/notify-chime.wav' },
  { id: 'soft', src: '/sounds/notify-soft.wav' },
  { id: 'alert', src: '/sounds/notify-alert.wav' },
  { id: 'pop', src: '/sounds/notify-pop.wav' },
  { id: 'bell', src: '/sounds/notify-bell.wav' },
];

const audioById = new Map<string, HTMLAudioElement>();

function resolveSrc(soundId?: NotificationSoundId): string {
  const id = soundId ?? getNotificationSoundId();
  return (
    NOTIFICATION_SOUND_OPTIONS.find((o) => o.id === id)?.src ??
    NOTIFICATION_SOUND_OPTIONS[0].src
  );
}

function getAudio(soundId?: NotificationSoundId): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  const id = soundId ?? getNotificationSoundId();
  const src = resolveSrc(id);
  let audio = audioById.get(id);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    audioById.set(id, audio);
  } else if (!audio.src.endsWith(src)) {
    audio.src = src;
  }
  return audio;
}

type PlayOptions = {
  /** Ayarlar ekranından test için mute/ses tercihini yok say */
  force?: boolean;
  /** Önizleme için belirli bir ses id’si */
  soundId?: NotificationSoundId;
};

/** Yeni uygulama içi bildirimde seçili sesi çalar (autoplay engeli sessizce yutulur). */
export function playInAppNotificationSound(options?: PlayOptions): void {
  if (!options?.force && (isNotificationsMuted() || !isNotificationSoundEnabled())) return;

  const audio = getAudio(options?.soundId);
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* kullanıcı etkileşimi yoksa tarayıcı engelleyebilir */
    });
  } catch {
    /* */
  }
}
