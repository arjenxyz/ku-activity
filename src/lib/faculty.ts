export const ENGLISH_TOURISM = 'Turizm İşletmeciliği (İngilizce)';
export const OTHER_DEPARTMENT = 'Diğer';

export type Choice = {
  value: string;
  label: string;
  hint: string;
};

export const DEPARTMENT_CHOICES: Choice[] = [
  { value: 'Turizm İşletmeciliği', label: 'Turizm İşletmeciliği', hint: 'Türkçe lisans' },
  { value: ENGLISH_TOURISM, label: 'Turizm İşletmeciliği (İngilizce)', hint: 'Zorunlu hazırlık bu bölümdedir' },
  { value: 'Turizm Rehberliği', label: 'Turizm Rehberliği', hint: 'Turizm Fakültesi' },
  { value: 'Gastronomi ve Mutfak Sanatları', label: 'Gastronomi ve Mutfak Sanatları', hint: 'Turizm Fakültesi' },
  { value: OTHER_DEPARTMENT, label: 'Diğer', hint: 'Başka bir fakülte veya bölüm' },
];

const YEAR_OPTIONS: Choice[] = [
  { value: '1', label: '1. sınıf', hint: 'Bölüm dersleri' },
  { value: '2', label: '2. sınıf', hint: 'Bölüm dersleri' },
  { value: '3', label: '3. sınıf', hint: 'Bölüm dersleri' },
  { value: '4', label: '4. sınıf', hint: 'Bölüm dersleri' },
];

/** Optional prep is A/B. Mandatory prep for English Tourism Management is C/D. */
export function classOptions(department: string): Choice[] {
  const prep =
    department === ENGLISH_TOURISM
      ? [
          { value: 'C', label: 'Hazırlık C', hint: 'Zorunlu İngilizce hazırlık' },
          { value: 'D', label: 'Hazırlık D', hint: 'Zorunlu İngilizce hazırlık' },
        ]
      : [
          { value: 'A', label: 'Hazırlık A', hint: 'İsteğe bağlı İngilizce hazırlık' },
          { value: 'B', label: 'Hazırlık B', hint: 'İsteğe bağlı İngilizce hazırlık' },
        ];
  return [...prep, ...YEAR_OPTIONS];
}

