/** Telefon/tablet — yerel kamera uygulaması getUserMedia'dan daha güvenilir */
export function prefersNativeCamera(): boolean {
  if (typeof window === 'undefined') return false;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return coarse || narrow || mobileUa;
}
