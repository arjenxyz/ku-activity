import QRCode from 'qrcode';

const CODE_PATTERN = /^KU-[A-Z0-9]{4}$/;

export function isApprovalQrCode(value: string) {
  return CODE_PATTERN.test(value.trim().toUpperCase());
}

/** Real PNG QR. Payload is only the approval code, not a name or student number. */
export async function renderApprovalQrPng(code: string) {
  const value = code.trim().toUpperCase();
  if (!isApprovalQrCode(value)) {
    throw new Error('Geçersiz onay kodu');
  }
  return QRCode.toBuffer(value, {
    type: 'png',
    width: 440,
    margin: 2,
    errorCorrectionLevel: 'H',
  });
}
