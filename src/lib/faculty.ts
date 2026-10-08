export const ENGLISH_TOURISM = 'Turizm İşletmeciliği (İngilizce)';

export const FACULTY_DEPARTMENTS = [
  'Turizm İşletmeciliği',
  ENGLISH_TOURISM,
  'Turizm Rehberliği',
  'Gastronomi ve Mutfak Sanatları',
] as const;

const YEAR_OPTIONS = [
  { value: '1', label: '1. sınıf' },
  { value: '2', label: '2. sınıf' },
  { value: '3', label: '3. sınıf' },
  { value: '4', label: '4. sınıf' },
];

/** Optional prep is A/B. Mandatory prep for English Tourism Management is C/D. */
export function classOptions(department: string) {
  const prep =
    department === ENGLISH_TOURISM
      ? [
          { value: 'C', label: 'Hazırlık C' },
          { value: 'D', label: 'Hazırlık D' },
        ]
      : [
          { value: 'A', label: 'Hazırlık A' },
          { value: 'B', label: 'Hazırlık B' },
        ];
  return [...prep, ...YEAR_OPTIONS];
}
