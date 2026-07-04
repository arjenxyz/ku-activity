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
