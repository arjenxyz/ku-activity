import { getPlatformInfo } from '@/lib/platform-config';

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

/** Sözleşme yer tutucuları — tüzel şirket yerine gönüllülük platformu bilgileri */
export function getCompanyInfo(): CompanyInfo {
  const platform = getPlatformInfo();
  return {
    legalName: `${platform.name} (${platform.nature} — tüzel kişilik yoktur)`,
    tradeName: platform.name,
    address: 'Merkez adresi bulunmamaktadır — dijital platform',
    city: 'Türkiye',
    taxOffice: 'Uygulanmaz (tüzel kişilik yok)',
    taxId: 'Uygulanmaz',
    mersisNo: 'Uygulanmaz',
    email: platform.contactEmail,
    phone: 'Belirtilmemiş',
    dataController: `${platform.developerName} (${platform.developerRole})`,
    authorizedRep: platform.developerName,
  };
}
