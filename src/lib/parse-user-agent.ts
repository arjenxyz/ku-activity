export type DeviceKind = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type ParsedDevice = {
  kind: DeviceKind;
  label: string;
  browser: string | null;
  os: string | null;
};

function detectOs(ua: string): string | null {
  if (/iPhone|iPod/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return null;
}

function detectBrowser(ua: string): string | null {
  if (/CrewLedger|PersonelApp/i.test(ua)) return 'CrewLedger';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/CriOS/.test(ua)) return 'Chrome';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return null;
}

function detectKind(ua: string): DeviceKind {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'mobile';
  }
  if (ua.length > 0) return 'desktop';
  return 'unknown';
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedDevice {
  const ua = userAgent?.trim() ?? '';
  if (!ua) {
    return { kind: 'unknown', label: '', browser: null, os: null };
  }

  const os = detectOs(ua);
  const browser = detectBrowser(ua);
  const kind = detectKind(ua);

  let label = '';
  if (browser && os) label = `${browser} · ${os}`;
  else if (browser) label = browser;
  else if (os) label = os;
  else label = ua.slice(0, 48);

  return { kind, label, browser, os };
}
