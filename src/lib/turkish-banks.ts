/** Türkiye IBAN banka kodu (TR + 2 hane + 5 hane banka kodu) */
const TR_BANK_CODES: Record<string, string> = {
  '00001': 'T.C. Merkez Bankası',
  '00004': 'İller Bankası',
  '00010': 'Ziraat Bankası',
  '00012': 'Halkbank',
  '00015': 'VakıfBank',
  '00017': 'Kalkınma ve Yatırım Bankası',
  '00029': 'Birleşik Fon Bankası',
  '00032': 'TEB',
  '00046': 'Akbank',
  '00059': 'Şekerbank',
  '00062': 'Garanti BBVA',
  '00064': 'İş Bankası',
  '00067': 'Yapı Kredi',
  '00096': 'Turkish Bank',
  '00099': 'ING',
  '00103': 'Fibabanka',
  '00108': 'Turkland Bank',
  '00111': 'QNB Finansbank',
  '00115': 'Deutsche Bank',
  '00123': 'HSBC',
  '00124': 'Alternatif Bank',
  '00125': 'Burgan Bank',
  '00134': 'Denizbank',
  '00135': 'Anadolu Bank',
  '00143': 'Aktif Yatırım Bankası',
  '00146': 'Odea Bank',
  '00147': 'Bank Mellat',
  '00148': 'Intesa Sanpaolo',
  '00203': 'Albaraka Türk',
  '00205': 'Kuveyt Türk',
  '00206': 'Türkiye Finans',
  '00209': 'Ziraat Katılım',
  '00210': 'Vakıf Katılım',
  '00211': 'Emlak Katılım',
  '00829': 'Papara Elektronik Para',
  '00832': 'Payfix',
  '00670': 'Enpara Bank',
};

const BANK_NAME_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /GARANT[İI]\s*BBVA|GARANTI\s*BBVA/i, name: 'Garanti BBVA' },
  { pattern: /T[ÜU]RK\s*EKO?NOM[İI]\s*BANKASI|TEB/i, name: 'TEB' },
  { pattern: /Z[İI]RAAT\s*(?:BANKASI|KATILIM)?/i, name: 'Ziraat Bankası' },
  { pattern: /HALK\s*BANKASI|HALKBANK/i, name: 'Halkbank' },
  { pattern: /VAKIF\s*KATILIM/i, name: 'Vakıf Katılım' },
  { pattern: /VAKIF\s*BANK|VAKIFBANK/i, name: 'VakıfBank' },
  { pattern: /AKBANK/i, name: 'Akbank' },
  { pattern: /[İI][ŞS]\s*BANKASI|IS\s*BANKASI/i, name: 'İş Bankası' },
  { pattern: /YAPI\s*(?:VE\s*)?KRED[İI]/i, name: 'Yapı Kredi' },
  { pattern: /QNB\s*FINANS|FINANSBANK/i, name: 'QNB Finansbank' },
  { pattern: /DENIZBANK|DEN[İI]ZBANK/i, name: 'Denizbank' },
  { pattern: /ING\s*BANK/i, name: 'ING' },
  { pattern: /HSBC/i, name: 'HSBC' },
  { pattern: /ENPARA/i, name: 'Enpara Bank' },
  { pattern: /PAPARA/i, name: 'Papara' },
  { pattern: /KUVEYT\s*T[ÜU]RK/i, name: 'Kuveyt Türk' },
  { pattern: /T[ÜU]RK[İI]YE\s*FINANS/i, name: 'Türkiye Finans' },
  { pattern: /ALBARAKA/i, name: 'Albaraka Türk' },
  { pattern: /ODEA\s*BANK/i, name: 'Odea Bank' },
  { pattern: /FIBABANKA/i, name: 'Fibabanka' },
  { pattern: /[ŞS]EKERBANK/i, name: 'Şekerbank' },
];

export type TransferType = 'fast' | 'eft' | 'havale' | 'wire';

export function extractTurkishBankCode(iban: string | null | undefined): string | null {
  if (!iban) return null;
  const compact = iban.replace(/\s/g, '').toUpperCase();
  if (!compact.startsWith('TR') || compact.length < 9) return null;
  return compact.slice(4, 9);
}

export function bankNameFromIban(iban: string | null | undefined): string | null {
  const code = extractTurkishBankCode(iban);
  if (!code) return null;
  return TR_BANK_CODES[code] ?? `Banka (${code})`;
}

/** IBAN satırında gösterim: kısa ad + renkli ikon / logo */
type BankBrand = { initials: string; color: string; textColor?: string };

const TR_BANK_BRANDS: Record<string, BankBrand> = {
  '00010': { initials: 'ZB', color: '#E30613' },
  '00012': { initials: 'HB', color: '#1B4F9C' },
  '00015': { initials: 'VB', color: '#F7A800', textColor: '#1a1a1a' },
  '00032': { initials: 'TEB', color: '#6C1D5F' },
  '00046': { initials: 'AK', color: '#E30613' },
  '00059': { initials: 'ŞB', color: '#00843D' },
  '00062': { initials: 'GA', color: '#00A3E0' },
  '00064': { initials: 'İŞ', color: '#0033A0' },
  '00067': { initials: 'YK', color: '#004B93' },
  '00096': { initials: 'TB', color: '#1E3A5F' },
  '00099': { initials: 'ING', color: '#FF6200' },
  '00103': { initials: 'FB', color: '#7B2D8E' },
  '00108': { initials: 'TL', color: '#0F766E' },
  '00111': { initials: 'QNB', color: '#7A1FA2' },
  '00115': { initials: 'DB', color: '#0018A8' },
  '00123': { initials: 'HS', color: '#DB0011' },
  '00124': { initials: 'AB', color: '#E30613' },
  '00125': { initials: 'BB', color: '#00A3E0' },
  '00134': { initials: 'DB', color: '#E30613' },
  '00135': { initials: 'AN', color: '#003087' },
  '00146': { initials: 'OB', color: '#00A651' },
  '00147': { initials: 'BM', color: '#C8102E' },
  '00148': { initials: 'IS', color: '#003366' },
  '00203': { initials: 'AT', color: '#006633' },
  '00205': { initials: 'KT', color: '#003366' },
  '00206': { initials: 'TF', color: '#003087' },
  '00209': { initials: 'ZK', color: '#E30613' },
  '00210': { initials: 'VK', color: '#F7A800', textColor: '#1a1a1a' },
  '00211': { initials: 'EK', color: '#0B3D91' },
  '00670': { initials: 'EN', color: '#7C3AED' },
  '00829': { initials: 'PA', color: '#9450E9' },
  '00832': { initials: 'PT', color: '#1D4ED8' },
};

/** Yerel logo dosyaları — `public/banks/{code}.{ext}` */
const TR_BANK_LOGO_FILES: Record<string, string> = {
  '00010': '00010.png',
  '00012': '00012.png',
  '00015': '00015.png',
  '00032': '00032.png',
  '00046': '00046.jpg',
  '00059': '00059.png',
  '00062': '00062.png',
  '00064': '00064.jpg',
  '00067': '00067.png',
  '00096': '00096.png',
  '00099': '00099.png',
  '00103': '00103.png',
  '00108': '00108.png',
  '00111': '00111.png',
  '00115': '00115.png',
  '00123': '00123.png',
  '00124': '00124.png',
  '00125': '00125.png',
  '00134': '00134.png',
  '00135': '00135.png',
  '00146': '00146.png',
  '00147': '00147.png',
  '00148': '00148.png',
  '00203': '00203.png',
  '00205': '00205.png',
  '00206': '00206.png',
  '00209': '00209.png',
  '00210': '00210.png',
  '00211': '00211.png',
  '00670': '00670.png',
  '00829': '00829.png',
  '00832': '00832.png',
};

export type TurkishBankDisplay = {
  code: string;
  name: string;
  initials: string;
  color: string;
  textColor: string;
  logoSrc: string | null;
};

export function bankLogoSrc(code: string | null | undefined): string | null {
  if (!code) return null;
  const file = TR_BANK_LOGO_FILES[code];
  return file ? `/banks/${file}` : null;
}

export function bankDisplayFromIban(iban: string | null | undefined): TurkishBankDisplay | null {
  const code = extractTurkishBankCode(iban);
  if (!code) return null;
  const name = TR_BANK_CODES[code] ?? `Banka (${code})`;
  const brand = TR_BANK_BRANDS[code];
  const logoSrc = bankLogoSrc(code);
  if (brand) {
    return {
      code,
      name,
      initials: brand.initials,
      color: brand.color,
      textColor: brand.textColor ?? '#ffffff',
      logoSrc,
    };
  }
  return {
    code,
    name,
    initials: code.slice(-2),
    color: '#334155',
    textColor: '#ffffff',
    logoSrc,
  };
}

function normalizeSearchText(text: string) {
  return text
    .toLocaleUpperCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Dekont metninden banka adı — bölüm bağlamına göre */
export function detectBankFromText(
  text: string,
  context: 'sender' | 'recipient' | 'any' = 'any'
): string | null {
  const upper = normalizeSearchText(text);
  const markers =
    context === 'sender'
      ? ['GONDEREN', 'GÖNDEREN', 'GONDERICI', 'GÖNDERİCİ', 'ISLEM YAPAN']
      : context === 'recipient'
        ? ['ALICI', 'ALACAKLI', 'LEHTAR', 'KARSI HESAP', 'KARŞI HESAP']
        : [];

  if (markers.length > 0) {
    for (const marker of markers) {
      const idx = upper.indexOf(normalizeSearchText(marker));
      if (idx === -1) continue;
      const slice = text.slice(idx, idx + 280);
      for (const { pattern, name } of BANK_NAME_PATTERNS) {
        if (pattern.test(slice)) return name;
      }
    }
  }

  for (const { pattern, name } of BANK_NAME_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  return null;
}

export function detectTransferType(text: string): TransferType | null {
  const upper = normalizeSearchText(text);
  if (/\bFAST\b/.test(upper) || /FAST\s*TR/.test(upper)) return 'fast';
  if (/\bEFT\b/.test(upper)) return 'eft';
  if (/HAVALE/.test(upper)) return 'havale';
  if (/SWIFT|WIRE/.test(upper)) return 'wire';
  return null;
}

export function transferTypeLabel(type: TransferType | null | undefined): string {
  if (type === 'fast') return 'FAST (Anlık Transfer)';
  if (type === 'eft') return 'EFT';
  if (type === 'havale') return 'Havale';
  if (type === 'wire') return 'Swift / Yurtdışı';
  return 'Banka transferi';
}

export function maskIbanForDisplay(iban: string | null | undefined): string | null {
  if (!iban) return null;
  const compact = iban.replace(/\s/g, '').toUpperCase();
  if (compact.length < 10) return compact;
  const visibleStart = compact.slice(0, 6);
  const visibleEnd = compact.slice(-4);
  return `${visibleStart} •••• •••• •••• ${visibleEnd}`;
}
