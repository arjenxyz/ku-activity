const TOKEN_PREFIX = 'YOK-';

export function normalizeAttendanceToken(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const match = text.match(/YOK-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
}

export function parseAttendanceTokenFromQr(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const t = url.searchParams.get('t') ?? url.searchParams.get('token');
    if (t) return normalizeAttendanceToken(t);
  } catch {
    // düz metin
  }

  return normalizeAttendanceToken(text);
}

export function buildAttendanceQrUrl(token: string, origin?: string) {
  const base =
    origin ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? 'https://crewledger.vercel.app');
  return `${base.replace(/\/$/, '')}/personnel-panel/yoklama?t=${encodeURIComponent(token)}`;
}

export { TOKEN_PREFIX };
