import type { HonorIconName, HonorIconTheme } from '@/components/icons/HonorIcons';
import { getProjectMenuIcon } from '@/lib/project-menu-icons';

export type AdminNavMode = 'simple' | 'advanced';

type MenuPathDef = {
  label: string;
  path?: string;
  absolutePath?: string;
  hint?: string;
};

export type AdminNavCopy = {
  dock: {
    summary: string;
    approval: string;
    attendance: string;
    profit: string;
    advance: string;
    deduction: string;
    menu: string;
  };
  hub: {
    dailyTitle: string;
    dailySubtitle: string;
    personnelTitle: string;
    siteTitle: string;
    financeTitle: string;
    controlTitle: string;
    generalTitle: string;
    generalSubtitle: string;
    general: {
      projects: string;
      arjenAdvance: string;
      arjenAttendance: string;
      applications: string;
      policy: string;
      settings: string;
    };
  };
  dailyItems: MenuPathDef[];
  simpleDailyItems: MenuPathDef[];
  personnelItems: MenuPathDef[];
  siteItems: MenuPathDef[];
  financeItems: MenuPathDef[];
  controlItems: MenuPathDef[];
};

export type AdminDockItem = {
  id: string;
  label: string;
  href?: string;
  iconName: HonorIconName;
  iconTheme: HonorIconTheme;
  isCenter?: boolean;
  matchHref?: string;
  isMenu?: boolean;
  onClick?: () => void;
};

export type AdminHubItem = {
  key: string;
  label: string;
  hint?: string;
  href: string;
  icon: { name: HonorIconName; theme: HonorIconTheme };
};

export type AdminHubSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: AdminHubItem[];
};

function projectHref(projectId: string, def: Pick<MenuPathDef, 'path' | 'absolutePath'>): string {
  if (def.absolutePath) return def.absolutePath;
  const base = `/admin-panel/proje/${projectId}`;
  return def.path ? `${base}/${def.path}` : base;
}

function toHubItem(projectId: string, def: MenuPathDef, key: string): AdminHubItem {
  const href = projectHref(projectId, def);
  const icon = getProjectMenuIcon(def.path, def.absolutePath);
  return { key, label: def.label, hint: def.hint, href, icon };
}

/** Alt dock — yönetici günlük iş akışı */
export function getAdminDockItems(
  projectId: string,
  mode: AdminNavMode,
  copy: AdminNavCopy
): AdminDockItem[] {
  const base = `/admin-panel/proje/${projectId}`;
  const d = copy.dock;

  if (mode === 'simple') {
    return [
      { id: 'summary', label: d.summary, href: base, iconName: 'home', iconTheme: 'blue', matchHref: base },
      { id: 'advance', label: d.advance, href: `${base}/avans`, iconName: 'wallet', iconTheme: 'indigo', matchHref: `${base}/avans` },
      {
        id: 'attendance',
        label: d.attendance,
        href: `${base}/yevmiye`,
        iconName: 'qr',
        iconTheme: 'teal',
        isCenter: true,
        matchHref: `${base}/yevmiye`,
      },
      { id: 'deduction', label: d.deduction, href: `${base}/kesinti`, iconName: 'minus', iconTheme: 'orange', matchHref: `${base}/kesinti` },
      { id: 'menu', label: d.menu, iconName: 'menu', iconTheme: 'slate', isMenu: true },
    ];
  }

  return [
    { id: 'summary', label: d.summary, href: base, iconName: 'home', iconTheme: 'blue', matchHref: base },
    {
      id: 'approval',
      label: d.approval,
      href: `${base}/basvuru-onay`,
      iconName: 'clipboard',
      iconTheme: 'amber',
      matchHref: `${base}/basvuru-onay`,
    },
    {
      id: 'attendance',
      label: d.attendance,
      href: `${base}/yevmiye`,
      iconName: 'qr',
      iconTheme: 'teal',
      isCenter: true,
      matchHref: `${base}/yevmiye`,
    },
    {
      id: 'profit',
      label: d.profit,
      href: `${base}/kar`,
      iconName: 'chart',
      iconTheme: 'violet',
      matchHref: `${base}/kar`,
    },
    { id: 'menu', label: d.menu, iconName: 'menu', iconTheme: 'slate', isMenu: true },
  ];
}

function mapSection(
  projectId: string,
  id: string,
  title: string,
  subtitle: string | undefined,
  items: MenuPathDef[]
): AdminHubSection {
  return {
    id,
    title,
    subtitle,
    items: items.map((item, i) => toHubItem(projectId, item, `${id}-${i}`)),
  };
}

/** Menü sheet bölümleri */
export function getAdminHubSections(
  projectId: string | null,
  mode: AdminNavMode,
  copy: AdminNavCopy
): AdminHubSection[] {
  const h = copy.hub;
  const sections: AdminHubSection[] = [];

  if (projectId) {
    const daily = mode === 'simple' ? copy.simpleDailyItems : copy.dailyItems;
    sections.push(mapSection(projectId, 'daily', h.dailyTitle, h.dailySubtitle, daily));

    if (mode === 'advanced') {
      sections.push(
        mapSection(projectId, 'personnel', h.personnelTitle, undefined, copy.personnelItems),
        mapSection(projectId, 'site', h.siteTitle, undefined, copy.siteItems),
        mapSection(projectId, 'finance', h.financeTitle, undefined, copy.financeItems),
        mapSection(projectId, 'control', h.controlTitle, undefined, copy.controlItems)
      );
    }
  }

  sections.push({
    id: 'general',
    title: h.generalTitle,
    subtitle: h.generalSubtitle,
    items: [
      { key: 'projects', label: h.general.projects, href: '/admin-panel', icon: { name: 'home', theme: 'blue' } },
      { key: 'arjen-avans', label: h.general.arjenAdvance, href: '/admin-panel/arjen/avans', icon: { name: 'chart', theme: 'violet' } },
      { key: 'arjen-yevmiye', label: h.general.arjenAttendance, href: '/admin-panel/arjen/yevmiye', icon: { name: 'calendar', theme: 'emerald' } },
      { key: 'applications', label: h.general.applications, href: '/admin-panel/basvuru-onay', icon: { name: 'clipboard', theme: 'amber' } },
      { key: 'policy', label: h.general.policy, href: '/admin-panel/maas-politikasi', icon: { name: 'sliders', theme: 'indigo' } },
      { key: 'settings', label: h.general.settings, href: '/admin-panel/ayarlar', icon: { name: 'settings', theme: 'slate' } },
    ],
  });

  return sections;
}
