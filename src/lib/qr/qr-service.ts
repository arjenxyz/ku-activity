import QRCode from 'qrcode';

const CODE_PATTERN = /^KU-[A-Z0-9]{4}$/;
const CHECKIN_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function isApprovalQrCode(value: string) {
  return CODE_PATTERN.test(value.trim().toUpperCase());
}

export function isCheckinQrToken(value: string) {
  return CHECKIN_TOKEN_PATTERN.test(value.trim());
}

async function renderPng(payload: string) {
  return QRCode.toBuffer(payload, {
    type: 'png',
    width: 440,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0E1548',
      light: '#FFFFFF',
    },
  });
}

/** Real PNG QR. Payload is only the approval code, not a name or student number. */
export async function renderApprovalQrPng(code: string) {
  const value = code.trim().toUpperCase();
  if (!isApprovalQrCode(value)) {
    throw new Error('Geçersiz onay kodu');
  }
  return renderPng(value);
}

/** Real PNG QR for check-in. Payload is an opaque token only — never PII. */
export async function renderCheckinQrPng(token: string) {
  const value = token.trim();
  if (!isCheckinQrToken(value)) {
    throw new Error('Geçersiz check-in token');
  }
  return renderPng(value);
}
