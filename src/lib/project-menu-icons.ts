import type { HonorIconName, HonorIconTheme } from '@/components/icons/HonorIcons';

export type ProjectMenuIconDef = {
  name: HonorIconName;
  theme: HonorIconTheme;
};

function byPath(path?: string, absolutePath?: string): ProjectMenuIconDef {
  if (absolutePath?.includes('dekont-paylas')) {
    return { name: 'scan', theme: 'teal' };
  }

  switch (path) {
    case '':
      return { name: 'home', theme: 'blue' };
    case 'yevmiye':
      return { name: 'calendar', theme: 'emerald' };
    case 'kar':
      return { name: 'chart', theme: 'violet' };
    case 'list':
      return { name: 'users', theme: 'blue' };
    case 'new':
      return { name: 'user-plus', theme: 'indigo' };
    case 'basvuru-onay':
      return { name: 'clipboard', theme: 'amber' };
    case 'sorgulama/personel-sifreleri':
      return { name: 'lock', theme: 'rose' };
    case 'avans':
      return { name: 'wallet', theme: 'sky' };
    case 'avans-talepleri':
      return { name: 'inbox', theme: 'blue' };
    case 'kesinti':
      return { name: 'minus', theme: 'orange' };
    case 'asgari':
      return { name: 'shield', theme: 'indigo' };
    case 'bloklar':
      return { name: 'grid', theme: 'teal' };
    case 'ekiplar':
      return { name: 'team', theme: 'emerald' };
    case 'durum':
      return { name: 'pie', theme: 'violet' };
    case 'bordro':
      return { name: 'document', theme: 'blue' };
    case 'maas-politikasi':
      return { name: 'sliders', theme: 'slate' };
    case 'raporlar':
      return { name: 'bar-chart', theme: 'indigo' };
    case 'raporlar/onaylanan':
      return { name: 'check', theme: 'emerald' };
    case 'raporlar/onaysiz':
      return { name: 'clock', theme: 'amber' };
    case 'kayit-gecmisi':
      return { name: 'archive', theme: 'slate' };
    case 'sorgulama/admin':
      return { name: 'bar-chart', theme: 'blue' };
    case 'sorgulama':
      return { name: 'users', theme: 'indigo' };
    case 'sorgulama/yevmiye':
      return { name: 'calendar', theme: 'emerald' };
    case 'sorgulama/avans':
      return { name: 'wallet', theme: 'sky' };
    case 'sorgulama/kesinti':
      return { name: 'minus', theme: 'orange' };
    case 'sorgulama/asgari':
      return { name: 'shield', theme: 'indigo' };
    case 'itirazlar':
      return { name: 'inbox', theme: 'rose' };
    default:
      return { name: 'document', theme: 'slate' };
  }
}

export function getProjectMenuIcon(path?: string, absolutePath?: string): ProjectMenuIconDef {
  return byPath(path, absolutePath);
}

export function getProjectMenuIconFromHref(href: string): ProjectMenuIconDef {
  const match = href.match(/\/admin-panel\/proje\/[^/]+\/(.+)$/)?.[1];
  if (href.includes('/dekont-paylas')) return byPath(undefined, href);
  if (!match) return byPath('');
  return byPath(match);
}
