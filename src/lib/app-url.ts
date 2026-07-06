export function getAppBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export function buildContractOtpConfirmUrl(linkToken: string): string {
  return `${getAppBaseUrl()}/personnel-panel/basvuru/dogrula?k=${encodeURIComponent(linkToken)}`;
}

export function buildPersonnelPinResetUrl(linkToken: string): string {
  return `${getAppBaseUrl()}/personnel-panel/pin-sifirla?k=${encodeURIComponent(linkToken)}`;
}

export function buildClosureAccelerationConfirmUrl(linkToken: string): string {
  return `${getAppBaseUrl()}/personnel-panel/kapanis/hizlandirma?k=${encodeURIComponent(linkToken)}`;
}
