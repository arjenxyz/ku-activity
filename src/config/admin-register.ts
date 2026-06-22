export const ADMIN_JOB_TITLES = [
  'Şantiye şefi / Usta',
  'Taşeron firma sahibi',
  'Proje müdürü',
  'İnsan kaynakları / Muhasebe',
  'Operasyon / Planlama',
  'Diğer',
] as const;

export const ADMIN_TEAM_SIZES = [
  { value: '1-10', label: '1 – 10 personel' },
  { value: '11-25', label: '11 – 25 personel' },
  { value: '26-50', label: '26 – 50 personel' },
  { value: '51-100', label: '51 – 100 personel' },
  { value: '100+', label: '100+ personel' },
] as const;

export const ADMIN_PROJECT_COUNTS = [
  { value: '1', label: '1 aktif şantiye' },
  { value: '2-3', label: '2 – 3 şantiye' },
  { value: '4+', label: '4 veya daha fazla' },
] as const;

export const ADMIN_REFERRAL_SOURCES = [
  { value: 'search', label: 'Google / arama' },
  { value: 'referral', label: 'Tanıdık / referans' },
  { value: 'social', label: 'Sosyal medya' },
  { value: 'event', label: 'Fuar / etkinlik' },
  { value: 'other', label: 'Diğer' },
] as const;
