export type CallingCode = {
  code: string;
  name: string;
  min: number;
  max: number;
};

/** National number length, without the leading 0. Turkey is first. */
export const CALLING_CODES: CallingCode[] = [
  { code: '90', name: 'Türkiye', min: 10, max: 10 },
  { code: '49', name: 'Almanya', min: 10, max: 11 },
  { code: '61', name: 'Avustralya', min: 9, max: 9 },
  { code: '43', name: 'Avusturya', min: 10, max: 13 },
  { code: '994', name: 'Azerbaycan', min: 9, max: 9 },
  { code: '32', name: 'Belçika', min: 9, max: 9 },
  { code: '971', name: 'Birleşik Arap Emirlikleri', min: 9, max: 9 },
  { code: '44', name: 'Birleşik Krallık', min: 10, max: 10 },
  { code: '387', name: 'Bosna-Hersek', min: 8, max: 8 },
  { code: '55', name: 'Brezilya', min: 10, max: 11 },
  { code: '359', name: 'Bulgaristan', min: 9, max: 9 },
  { code: '420', name: 'Çekya', min: 9, max: 9 },
  { code: '86', name: 'Çin', min: 11, max: 11 },
  { code: '45', name: 'Danimarka', min: 8, max: 8 },
  { code: '62', name: 'Endonezya', min: 9, max: 12 },
  { code: '251', name: 'Etiyopya', min: 9, max: 9 },
  { code: '212', name: 'Fas', min: 9, max: 9 },
  { code: '33', name: 'Fransa', min: 9, max: 9 },
  { code: '27', name: 'Güney Afrika', min: 9, max: 9 },
  { code: '82', name: 'Güney Kore', min: 9, max: 10 },
  { code: '995', name: 'Gürcistan', min: 9, max: 9 },
  { code: '91', name: 'Hindistan', min: 10, max: 10 },
  { code: '31', name: 'Hollanda', min: 9, max: 9 },
  { code: '964', name: 'Irak', min: 10, max: 10 },
  { code: '98', name: 'İran', min: 10, max: 10 },
  { code: '353', name: 'İrlanda', min: 9, max: 9 },
  { code: '34', name: 'İspanya', min: 9, max: 9 },
  { code: '46', name: 'İsveç', min: 9, max: 9 },
  { code: '41', name: 'İsviçre', min: 9, max: 9 },
  { code: '39', name: 'İtalya', min: 9, max: 10 },
  { code: '81', name: 'Japonya', min: 10, max: 10 },
  { code: '974', name: 'Katar', min: 8, max: 8 },
  { code: '7', name: 'Kazakistan / Rusya', min: 10, max: 10 },
  { code: '254', name: 'Kenya', min: 9, max: 9 },
  { code: '996', name: 'Kırgızistan', min: 9, max: 9 },
  { code: '383', name: 'Kosova', min: 8, max: 8 },
  { code: '965', name: 'Kuveyt', min: 8, max: 8 },
  { code: '218', name: 'Libya', min: 9, max: 9 },
  { code: '36', name: 'Macaristan', min: 9, max: 9 },
  { code: '389', name: 'Kuzey Makedonya', min: 8, max: 8 },
  { code: '60', name: 'Malezya', min: 9, max: 10 },
  { code: '20', name: 'Mısır', min: 10, max: 10 },
  { code: '373', name: 'Moldova', min: 8, max: 8 },
  { code: '234', name: 'Nijerya', min: 10, max: 10 },
  { code: '47', name: 'Norveç', min: 8, max: 8 },
  { code: '92', name: 'Pakistan', min: 10, max: 10 },
  { code: '48', name: 'Polonya', min: 9, max: 9 },
  { code: '351', name: 'Portekiz', min: 9, max: 9 },
  { code: '40', name: 'Romanya', min: 9, max: 9 },
  { code: '381', name: 'Sırbistan', min: 8, max: 9 },
  { code: '421', name: 'Slovakya', min: 9, max: 9 },
  { code: '963', name: 'Suriye', min: 9, max: 9 },
  { code: '966', name: 'Suudi Arabistan', min: 9, max: 9 },
  { code: '992', name: 'Tacikistan', min: 9, max: 9 },
  { code: '216', name: 'Tunus', min: 8, max: 8 },
  { code: '993', name: 'Türkmenistan', min: 8, max: 8 },
  { code: '380', name: 'Ukrayna', min: 9, max: 9 },
  { code: '962', name: 'Ürdün', min: 9, max: 9 },
  { code: '1', name: 'ABD / Kanada', min: 10, max: 10 },
  { code: '998', name: 'Özbekistan', min: 9, max: 9 },
  { code: '30', name: 'Yunanistan', min: 10, max: 10 },
];

export function findCallingCode(code: string) {
  return CALLING_CODES.find((item) => item.code === code) ?? CALLING_CODES[0];
}

export function callingCodeChoices() {
  return CALLING_CODES.map((item) => ({
    value: item.code,
    label: `+${item.code}`,
    hint: item.min === item.max ? `${item.name} · ${item.max} hane` : `${item.name} · ${item.min}–${item.max} hane`,
  }));
}
