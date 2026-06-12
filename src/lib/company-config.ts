import { DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';

export type CompanyInfo = {
  legalName: string;
  tradeName: string;
  address: string;
  city: string;
  taxOffice: string;
  taxId: string;
  mersisNo: string;
  email: string;
  phone: string;
  dataController: string;
  authorizedRep: string;
};

export function getCompanyInfo(): CompanyInfo {
  return {
    legalName:
      process.env.COMPANY_LEGAL_NAME?.trim() ||
      'Örnek İnşaat ve Taşeronluk Anonim Şirketi',
    tradeName: process.env.COMPANY_TRADE_NAME?.trim() || 'CrewLedger Demo İşletmesi',
    address:
      process.env.COMPANY_ADDRESS?.trim() ||
      'Örnek Mah. Şantiye Cad. No:1, 34000 İstanbul',
    city: process.env.COMPANY_CITY?.trim() || 'İstanbul',
    taxOffice: process.env.COMPANY_TAX_OFFICE?.trim() || 'Örnek Vergi Dairesi',
    taxId: process.env.COMPANY_TAX_ID?.trim() || '0000000000',
    mersisNo: process.env.COMPANY_MERSIS?.trim() || '0000-0000-0000-0000',
    email: process.env.COMPANY_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL,
    phone: process.env.COMPANY_PHONE?.trim() || '+90 212 000 00 00',
    dataController:
      process.env.COMPANY_DATA_CONTROLLER?.trim() ||
      'Proje Yöneticisi / İnsan Kaynakları Sorumlusu',
    authorizedRep: process.env.COMPANY_AUTHORIZED_REP?.trim() || 'Yetkili Temsilci',
  };
}
