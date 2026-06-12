import { APP_NAME, DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;

export function verificationCodeMailto(subject?: string) {
  const s = subject || `${APP_NAME} — Project verification code request`;
  const body = encodeURIComponent(
    `Hello,\n\nI would like to use ${APP_NAME} for construction workforce management.\nPlease send a project verification code.\n\nCompany name:\nPhone:\nEstimated crew size:\n\nThank you.`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(s)}&body=${body}`;
}
