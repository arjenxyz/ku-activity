import strings from '@json/src/config/projectMenu.json';

export type ProjectMenuLink = {
  label: string;
  href: (projectId: string) => string;
  /** Alt menüde gösterilecek kısa açıklama */
  hint?: string;
};

export type ProjectMenuGroup = {
  id: string;
  label: string;
  links: ProjectMenuLink[];
};

type MenuLinkDef = {
  label: string;
  path?: string;
  absolutePath?: string;
  hint?: string;
};

type RecordArchiveDef = MenuLinkDef & { desc: string };

function projectHref(projectId: string, def: Pick<MenuLinkDef, 'path' | 'absolutePath'>): string {
  if (def.absolutePath) return def.absolutePath;
  const base = `/admin-panel/proje/${projectId}`;
  return def.path ? `${base}/${def.path}` : base;
}

function toMenuLink(projectId: string, def: MenuLinkDef): ProjectMenuLink {
  const href = projectHref(projectId, def);
  return {
    label: def.label,
    href: () => href,
    ...(def.hint ? { hint: def.hint } : {}),
  };
}

/** Her gün kullanılan — yan menüde her zaman görünür */
export function getProjectMenuPrimary(projectId: string): ProjectMenuLink[] {
  return strings.primary.map((def) => toMenuLink(projectId, def));
}

/** Gruplar — sadece ilgili olan açılır */
export function getProjectMenuGroups(projectId: string): ProjectMenuGroup[] {
  return strings.groups.map((group) => ({
    id: group.id,
    label: group.label,
    links: group.links.map((def) => toMenuLink(projectId, def)),
  }));
}

/** Kayıt geçmişi hub sayfasındaki alt linkler */
export function getRecordArchiveLinks(
  projectId: string
): Array<ProjectMenuLink & { desc: string }> {
  return strings.recordArchive.map((def: RecordArchiveDef) => ({
    ...toMenuLink(projectId, def),
    desc: def.desc,
  }));
}

/** Aktif sayfanın hangi gruba ait olduğunu bul */
export function findActiveMenuGroupId(
  projectId: string,
  pathname: string
): string | null {
  const primary = getProjectMenuPrimary(projectId);
  if (primary.some((l) => isMenuPathActive(projectId, pathname, l.href(projectId)))) {
    return null;
  }

  if (pathname.includes('/kayit-gecmisi') || pathname.includes('/sorgulama')) {
    return 'kontrol';
  }

  for (const group of getProjectMenuGroups(projectId)) {
    if (group.links.some((l) => isMenuPathActive(projectId, pathname, l.href(projectId)))) {
      return group.id;
    }
  }
  return null;
}

export function isMenuPathActive(projectId: string, pathname: string, href: string): boolean {
  const home = `/admin-panel/proje/${projectId}`;
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}
