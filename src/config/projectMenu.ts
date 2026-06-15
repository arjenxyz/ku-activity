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

/** Her gün kullanılan — yan menüde her zaman görünür */
export function getProjectMenuPrimary(projectId: string): ProjectMenuLink[] {
  const id = projectId;
  return [
    {
      label: 'Proje özeti',
      href: () => `/admin-panel/proje/${id}`,
      hint: 'Personel ve günlük durum',
    },
    {
      label: 'Yevmiye',
      href: () => `/admin-panel/proje/${id}/yevmiye`,
      hint: 'Günlük çalışma kaydı',
    },
    {
      label: 'Taşeron karı',
      href: () => `/admin-panel/proje/${id}/kar`,
      hint: 'Blok, iş kalemi ve kâr',
    },
  ];
}

/** Gruplar — sadece ilgili olan açılır */
export function getProjectMenuGroups(projectId: string): ProjectMenuGroup[] {
  const id = projectId;
  return [
    {
      id: 'personel',
      label: 'Personel',
      links: [
        { label: 'Personel listesi', href: () => `/admin-panel/proje/${id}/list` },
        { label: 'Yeni personel', href: () => `/admin-panel/proje/${id}/new` },
        { label: 'Başvuru onayı', href: () => `/admin-panel/proje/${id}/basvuru-onay` },
        {
          label: 'Personel şifreleri',
          href: () => `/admin-panel/proje/${id}/sorgulama/personel-sifreleri`,
        },
      ],
    },
    {
      id: 'kayitlar',
      label: 'Diğer kayıtlar',
      links: [
        { label: 'Avans', href: () => `/admin-panel/proje/${id}/avans` },
        { label: 'Kesinti', href: () => `/admin-panel/proje/${id}/kesinti` },
        { label: 'Asgari ücret', href: () => `/admin-panel/proje/${id}/asgari` },
      ],
    },
    {
      id: 'santiye',
      label: 'Şantiye',
      links: [
        { label: 'Bloklar', href: () => `/admin-panel/proje/${id}/bloklar` },
        { label: 'Ekipler', href: () => `/admin-panel/proje/${id}/ekiplar` },
      ],
    },
    {
      id: 'finans',
      label: 'Finans',
      links: [
        { label: 'Ne durumdayız?', href: () => `/admin-panel/proje/${id}/durum` },
        { label: 'Maaş bordrosu', href: () => `/admin-panel/proje/${id}/bordro` },
        {
          label: 'Maaş politikası',
          href: () => `/admin-panel/proje/${id}/maas-politikasi`,
        },
      ],
    },
    {
      id: 'kontrol',
      label: 'Kontrol & rapor',
      links: [
        { label: 'Raporlar', href: () => `/admin-panel/proje/${id}/raporlar` },
        { label: 'Onaylananlar', href: () => `/admin-panel/proje/${id}/raporlar/onaylanan` },
        { label: 'Bekleyen kayıtlar', href: () => `/admin-panel/proje/${id}/raporlar/onaysiz` },
        { label: 'Personel itirazları', href: () => `/admin-panel/proje/${id}/itirazlar` },
        {
          label: 'Kayıt geçmişi',
          href: () => `/admin-panel/proje/${id}/kayit-gecmisi`,
          hint: 'Sorgulama ve arşiv',
        },
      ],
    },
  ];
}

/** Kayıt geçmişi hub sayfasındaki alt linkler */
export function getRecordArchiveLinks(projectId: string): Array<ProjectMenuLink & { desc: string }> {
  const id = projectId;
  return [
    {
      label: 'Aylık özet',
      desc: 'Tüm personelin ay bazında yevmiye, avans ve net durumu',
      href: () => `/admin-panel/proje/${id}/sorgulama/admin`,
    },
    {
      label: 'Personel bazlı',
      desc: 'Tek personelin yevmiye, avans ve asgari kayıtları',
      href: () => `/admin-panel/proje/${id}/sorgulama`,
    },
    {
      label: 'Yevmiye arşivi',
      desc: 'Tarih ve personele göre yevmiye listesi',
      href: () => `/admin-panel/proje/${id}/sorgulama/yevmiye`,
    },
    {
      label: 'Avans arşivi',
      desc: 'Verilen avansların listesi',
      href: () => `/admin-panel/proje/${id}/sorgulama/avans`,
    },
    {
      label: 'Kesinti arşivi',
      desc: 'Kesinti kayıtları',
      href: () => `/admin-panel/proje/${id}/sorgulama/kesinti`,
    },
    {
      label: 'Asgari arşivi',
      desc: 'Asgari ücret tamamlama kayıtları',
      href: () => `/admin-panel/proje/${id}/sorgulama/asgari`,
    },
  ];
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
