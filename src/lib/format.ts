export function formatMoney(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDate(value: string) {
  return new Date(value + (value.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('tr-TR');
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
}

/** Saat dilimi: Europe/Istanbul — yalnızca saat:dakika */
export function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
}

/** PDF / liste: tarih + işlem saati (varsa) */
export function formatDateWithTime(date: string, at?: string | null) {
  const day = formatDate(date);
  const time = formatTime(at);
  return time ? `${day} ${time}` : day;
}

export function formatFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function splitFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
