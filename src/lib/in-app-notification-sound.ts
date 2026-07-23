/** Uygulama içi bildirim bip sesi — `/public/bip.mp3` */

import {
  isNotificationSoundEnabled,
  isNotificationsMuted,
} from '@/lib/personnel-notification-storage';

const BIP_SRC = '/bip.mp3';

let sharedAudio: HTMLAudioElement | null = null;

function getBipAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(BIP_SRC);
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

type PlayOptions = {
  /** Ayarlar ekranından test için mute/ses tercihini yok say */
  force?: boolean;
};

/** Yeni uygulama içi bildirimde kısa bip çalar (autoplay engeli sessizce yutulur). */
export function playInAppNotificationSound(options?: PlayOptions): void {
  if (!options?.force && (isNotificationsMuted() || !isNotificationSoundEnabled())) return;

  const audio = getBipAudio();
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
