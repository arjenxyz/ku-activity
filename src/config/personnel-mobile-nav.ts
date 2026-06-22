import type { PersonnelTabId } from '@/hooks/usePersonnelTab';

export const PERSONNEL_MOBILE_TAB_TITLES: Record<PersonnelTabId, string> = {
  overview: 'Ana Sayfa',
  work: 'Yevmiye',
  mesai: 'Mesai',
  asgari: 'Asgari Ücret',
  finance: 'Finans',
  rights: 'Haklarım',
  settings: 'Ayarlar',
};

export const PERSONNEL_MORE_ITEMS = [
  { tab: 'mesai' as const, label: 'Mesai', description: 'Fazla çalışma kayıtları' },
  { tab: 'asgari' as const, label: 'Asgari Ücret', description: 'Tamamlama ve ödeme durumu' },
  { tab: 'rights' as const, label: 'Haklarım', description: 'Sözleşmeler ve belgeler' },
  { tab: 'settings' as const, label: 'Ayarlar', description: 'Profil ve güvenlik' },
];
