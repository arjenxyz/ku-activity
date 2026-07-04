import { APP_NAME, DEFAULT_APP_URL, DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';

export type PlatformInfo = {
  name: string;
  url: string;
  nature: string;
  developerName: string;
  developerRole: string;
  contactEmail: string;
  establishedNote: string;
  legalDisclaimer: string;
};

/** CrewLedger — gönüllülük / kişisel geliştirme projesi meta bilgileri */
export function getPlatformInfo(): PlatformInfo {
  return {
    name: process.env.PLATFORM_NAME?.trim() || APP_NAME,
    url: process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL,
    nature:
      process.env.PLATFORM_NATURE?.trim() ||
      'kar amacı gütmeyen, gönüllülük esaslı dijital personel takip platformu',
    developerName: process.env.PLATFORM_DEVELOPER_NAME?.trim() || 'Arjen Esen',
    developerRole:
      process.env.PLATFORM_DEVELOPER_ROLE?.trim() ||
      'bireysel geliştirici ve platform operatörü',
    contactEmail: process.env.PLATFORM_CONTACT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL,
    establishedNote:
      'CrewLedger, herhangi bir anonim şirket, limited şirket veya resmi işveren unvanı altında faaliyet göstermez.',
    legalDisclaimer:
      'Platform resmi devlet kayıt sistemleri (e-Devlet, SGK, NVI vb.) ile entegre değildir; yevmiye ve ödeme kayıtları bilgilendirme ve şeffaflık amaçlıdır.',
  };
}
