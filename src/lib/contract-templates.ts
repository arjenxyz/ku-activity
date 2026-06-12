import { createHash } from 'crypto';
import { getCompanyInfo } from '@/lib/company-config';

const PLACEHOLDERS: Record<string, (c: ReturnType<typeof getCompanyInfo>) => string> = {
  '{{COMPANY_LEGAL_NAME}}': (c) => c.legalName,
  '{{COMPANY_TRADE_NAME}}': (c) => c.tradeName,
  '{{COMPANY_ADDRESS}}': (c) => c.address,
  '{{COMPANY_CITY}}': (c) => c.city,
  '{{COMPANY_TAX_OFFICE}}': (c) => c.taxOffice,
  '{{COMPANY_TAX_ID}}': (c) => c.taxId,
  '{{COMPANY_MERSIS}}': (c) => c.mersisNo,
  '{{COMPANY_EMAIL}}': (c) => c.email,
  '{{COMPANY_PHONE}}': (c) => c.phone,
  '{{COMPANY_DATA_CONTROLLER}}': (c) => c.dataController,
  '{{COMPANY_AUTHORIZED_REP}}': (c) => c.authorizedRep,
};

export function applyContractPlaceholders(html: string): string {
  const company = getCompanyInfo();
  let out = html;
  for (const [token, resolver] of Object.entries(PLACEHOLDERS)) {
    out = out.split(token).join(resolver(company));
  }
  return out;
}

export function hashContractContent(slug: string, version: number, contentHtml: string): string {
  const payload = `${slug}|v${version}|${contentHtml}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
