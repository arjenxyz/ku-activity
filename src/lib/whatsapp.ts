import { normalizePhoneDigits } from '@/lib/field-encryption';

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
