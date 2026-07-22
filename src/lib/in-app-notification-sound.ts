/** Uygulama içi bildirim bip sesi — `/public/bip.mp3` */

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

/** Yeni uygulama içi bildirimde kısa bip çalar (autoplay engeli sessizce yutulur). */
export function playInAppNotificationSound(): void {
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
