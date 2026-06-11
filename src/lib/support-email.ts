export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'info@arjendev.com';

export function verificationCodeMailto(subject?: string) {
  const s = subject || 'ArjenDev — Proje doğrulama kodu talebi';
  const body = encodeURIComponent(
    'Merhaba,\n\nArjenDev personel yönetim sistemini kullanmak istiyorum.\nLütfen bir proje doğrulama kodu gönderebilir misiniz?\n\nFirma adı:\nİletişim telefonu:\nTahmini personel sayısı:\n\nTeşekkürler.'
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(s)}&body=${body}`;
}
