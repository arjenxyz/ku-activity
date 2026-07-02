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

export type PersonnelHubItem = {
  id: string;
  label: string;
  description: string;
  accent: PersonnelMoreAccent;
  tab?: PersonnelTabId;
  href?: string;
};

export type PersonnelHubSection = {
  title: string;
  subtitle: string;
  items: PersonnelHubItem[];
};

/** Panel hub — tüm bölümler kategorilere ayrılmış */
export const PERSONNEL_HUB_SECTIONS: PersonnelHubSection[] = [
  {
    title: 'Sahada',
    subtitle: 'Günlük çalışma kayıtları',
    items: [
      {
        id: 'work',
        tab: 'work',
        label: 'Yevmiye',
        description: 'Çalışılan günler',
        accent: 'emerald',
      },
      {
        id: 'mesai',
        tab: 'mesai',
        label: 'Mesai',
        description: 'Fazla mesai',
        accent: 'violet',
      },
      {
        id: 'yoklama',
        href: '/personnel-panel/yoklama',
        label: 'Yoklama',
        description: 'QR ile giriş',
        accent: 'teal',
      },
    ],
  },
  {
    title: 'Finans',
    subtitle: 'Maaş ve ödemeler',
    items: [
      {
        id: 'finance',
        tab: 'finance',
        label: 'Bordro',
        description: 'Net maaş özeti',
        accent: 'indigo',
      },
      {
        id: 'asgari',
        tab: 'asgari',
        label: 'Asgari',
        description: 'Tamamlama durumu',
        accent: 'blue',
      },
    ],
  },
  {
    title: 'Hesabım',
    subtitle: 'Profil ve belgeler',
    items: [
      {
        id: 'rights',
        tab: 'rights',
        label: 'Haklarım',
        description: 'Sözleşmeler',
        accent: 'sky',
      },
      {
        id: 'settings',
        tab: 'settings',
        label: 'Ayarlar',
        description: 'PIN ve profil',
        accent: 'slate',
      },
    ],
  },
];

export const PERSONNEL_HUB_TABS: PersonnelTabId[] = [
  'work',
  'mesai',
  'finance',
  'asgari',
  'rights',
  'settings',
];

export type PersonnelMoreAccent =
  | 'emerald'
  | 'violet'
  | 'teal'
  | 'indigo'
  | 'blue'
  | 'sky'
  | 'slate';

/** Alt dock — hub ile aynı renk dili */
export const PERSONNEL_DOCK_ACCENTS: Record<string, PersonnelMoreAccent> = {
  home: 'blue',
  work: 'emerald',
  finance: 'indigo',
  more: 'slate',
};

export const PERSONNEL_NAV_TILE_ACCENTS: Record<
  PersonnelMoreAccent,
  { tile: string; icon: string; glow: string; muted: string; label: string }
> = {
  emerald: {
    tile: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/25',
    icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    muted: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    tile: 'from-violet-500/20 to-violet-600/5 border-violet-500/25',
    icon: 'bg-violet-500 text-white shadow-violet-500/30',
    glow: 'shadow-violet-500/10',
    muted: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
    label: 'text-violet-600 dark:text-violet-400',
  },
  teal: {
    tile: 'from-teal-500/20 to-teal-600/5 border-teal-500/25',
    icon: 'bg-teal-500 text-white shadow-teal-500/30',
    glow: 'shadow-teal-500/10',
    muted: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400',
    label: 'text-teal-600 dark:text-teal-400',
  },
  indigo: {
    tile: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/25',
    icon: 'bg-indigo-500 text-white shadow-indigo-500/30',
    glow: 'shadow-indigo-500/10',
    muted: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    label: 'text-indigo-600 dark:text-indigo-400',
  },
  blue: {
    tile: 'from-blue-500/20 to-blue-600/5 border-blue-500/25',
    icon: 'bg-blue-600 text-white shadow-blue-500/30',
    glow: 'shadow-blue-500/10',
    muted: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    label: 'text-blue-600 dark:text-blue-400',
  },
  sky: {
    tile: 'from-sky-500/20 to-sky-600/5 border-sky-500/25',
    icon: 'bg-sky-500 text-white shadow-sky-500/30',
    glow: 'shadow-sky-500/10',
    muted: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
    label: 'text-sky-600 dark:text-sky-400',
  },
  slate: {
    tile: 'from-slate-500/15 to-slate-600/5 border-slate-500/20',
    icon: 'bg-slate-600 text-white shadow-slate-500/20',
    glow: 'shadow-slate-500/10',
    muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    label: 'text-slate-700 dark:text-slate-300',
  },
};
