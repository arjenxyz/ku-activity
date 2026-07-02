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
  {
    tab: 'mesai' as const,
    label: 'Mesai',
    description: 'Fazla çalışma kayıtları',
    accent: 'violet',
  },
  {
    tab: 'asgari' as const,
    label: 'Asgari Ücret',
    description: 'Tamamlama ve ödeme durumu',
    accent: 'indigo',
  },
  {
    tab: 'rights' as const,
    label: 'Haklarım',
    description: 'Sözleşmeler ve belgeler',
    accent: 'sky',
  },
  {
    tab: 'settings' as const,
    label: 'Ayarlar',
    description: 'Profil ve güvenlik',
    accent: 'slate',
  },
] as const;

export type PersonnelMoreAccent = (typeof PERSONNEL_MORE_ITEMS)[number]['accent'];

export const PERSONNEL_NAV_ACCENTS = {
  home: {
    active: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
    idle: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  work: {
    active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
    idle: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  finance: {
    active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    idle: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  menu: {
    active: 'bg-slate-800 text-white shadow-md shadow-slate-900/20',
    idle: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    text: 'text-slate-700 dark:text-slate-300',
  },
  violet: {
    active: 'bg-violet-600 text-white',
    idle: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
  },
  indigo: {
    active: 'bg-indigo-600 text-white',
    idle: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  sky: {
    active: 'bg-sky-600 text-white',
    idle: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
  },
  slate: {
    active: 'bg-slate-700 text-white',
    idle: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
} as const;

export type PersonnelMainNavAccent = 'home' | 'work' | 'finance' | 'menu';
