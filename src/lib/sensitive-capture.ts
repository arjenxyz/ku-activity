/** Ekran görüntüsünde gizlenecek alanlar (T.C. kimlik + şifre/PIN) */

export const SENSITIVE_CAPTURE_SELECTOR = [
  '[data-sensitive-capture]',
  '#personnel-tc',
  '#personnel-pin',
  '#forgot-tc',
  '#forgot-pin-tc',
  '#forgot-pin-tc-hint',
  'input.pin-mask',
  'input[type="password"]',
].join(', ');

const BLUR_PX = 10;

function maskDisplayValue(input: HTMLInputElement): string {
  const len = input.value.length || Number(input.maxLength) || 8;
  const maskLen = Math.min(Math.max(len, 6), 16);
  return '•'.repeat(maskLen);
}

/** html2canvas onclone — canlı DOM'a dokunmadan klon üzerinde maskele */
export function maskSensitiveFieldsInClone(clonedDoc: Document): void {
  clonedDoc.querySelectorAll<HTMLInputElement>(SENSITIVE_CAPTURE_SELECTOR).forEach((input) => {
    input.value = maskDisplayValue(input);
    input.setAttribute('value', input.value);
    input.style.filter = `blur(${BLUR_PX}px)`;
    input.style.webkitFilter = `blur(${BLUR_PX}px)`;
  });
}
