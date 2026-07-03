/** Ekran raporu — Discord (öncelik) veya e-posta */

import { sendScreenReportDiscord, isDiscordReportConfigured } from '@/lib/screen-report-discord';
import { sendScreenReportEmail } from '@/lib/screen-report-email';
import type { ScreenReportInput } from '@/lib/screen-report-types';

export type { ScreenReportInput } from '@/lib/screen-report-types';

export async function sendScreenReport(input: ScreenReportInput): Promise<void> {
  if (isDiscordReportConfigured()) {
    await sendScreenReportDiscord(input);
    return;
  }
  await sendScreenReportEmail(input);
}
