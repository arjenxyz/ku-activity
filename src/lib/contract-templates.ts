import { createHash } from 'crypto';
import { getCompanyInfo } from '@/lib/company-config';
import { getPlatformInfo } from '@/lib/platform-config';

const PLACEHOLDERS: Record<string, () => string> = {
  '{{COMPANY_LEGAL_NAME}}': () => getCompanyInfo().legalName,
  '{{COMPANY_TRADE_NAME}}': () => getCompanyInfo().tradeName,
  '{{COMPANY_ADDRESS}}': () => getCompanyInfo().address,
  '{{COMPANY_CITY}}': () => getCompanyInfo().city,
  '{{COMPANY_TAX_OFFICE}}': () => getCompanyInfo().taxOffice,
  '{{COMPANY_TAX_ID}}': () => getCompanyInfo().taxId,
  '{{COMPANY_MERSIS}}': () => getCompanyInfo().mersisNo,
  '{{COMPANY_EMAIL}}': () => getCompanyInfo().email,
  '{{COMPANY_PHONE}}': () => getCompanyInfo().phone,
  '{{COMPANY_DATA_CONTROLLER}}': () => getCompanyInfo().dataController,
  '{{COMPANY_AUTHORIZED_REP}}': () => getCompanyInfo().authorizedRep,
  '{{PLATFORM_NAME}}': () => getPlatformInfo().name,
  '{{PLATFORM_URL}}': () => getPlatformInfo().url,
  '{{PLATFORM_NATURE}}': () => getPlatformInfo().nature,
  '{{DEVELOPER_NAME}}': () => getPlatformInfo().developerName,
  '{{DEVELOPER_ROLE}}': () => getPlatformInfo().developerRole,
  '{{PLATFORM_CONTACT}}': () => getPlatformInfo().contactEmail,
};

export function applyContractPlaceholders(html: string): string {
  let out = html;
  for (const [token, resolver] of Object.entries(PLACEHOLDERS)) {
    out = out.split(token).join(resolver());
  }
  return out;
}

export function hashContractContent(slug: string, version: number, contentHtml: string): string {
  const payload = `${slug}|v${version}|${contentHtml}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
