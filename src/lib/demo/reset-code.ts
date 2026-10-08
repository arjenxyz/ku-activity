/** Sample code an admin would hand out, or encode in a QR. */
export const DEMO_RESET_CODE = 'KU-DEMO-1';

export function isResetCode(value: string) {
  return value.trim().toUpperCase() === DEMO_RESET_CODE;
}
