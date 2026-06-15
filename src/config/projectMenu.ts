export type ProjectMenuLink = {
  label: string;
  href: (projectId: string) => string;
};

export type ProjectMenuGroup = {
  id: string;
  label: string;
  links: ProjectMenuLink[];
};

export function getProjectMenuGroups(projectId: string): ProjectMenuGroup[] {
  const id = projectId;
  return [
    {
      id: 'personel',
      label: 'Personel Yönetimi',
      links: [
        { label: 'Proje Özeti', href: () => `/admin-panel/proje/${id}` },
        { label: 'Yeni Personel Ekle', href: () => `/admin-panel/proje/${id}/new` },
        { label: 'Başvuru Onayı', href: (id) => `/admin-panel/proje/${id}/basvuru-onay` },
        { label: 'Personel Listesi', href: () => `/admin-panel/proje/${id}/list` },
        { label: 'Avans Ekle', href: () => `/admin-panel/proje/${id}/avans` },
        { label: 'Kesinti Ekle', href: () => `/admin-panel/proje/${id}/kesinti` },
        { label: 'Yevmiye Ekle', href: () => `/admin-panel/proje/${id}/yevmiye` },
        { label: 'Asgari Ekle', href: () => `/admin-panel/proje/${id}/asgari` },
      ],
    },
    {
      id: 'sorgulama',
      label: 'Sorgulama',
      links: [
        { label: 'Personel Sorgulaması', href: () => `/admin-panel/proje/${id}/sorgulama` },
        { label: 'Admin Sorgulama', href: () => `/admin-panel/proje/${id}/sorgulama/admin` },
        { label: 'Personel Şifreleri', href: () => `/admin-panel/proje/${id}/sorgulama/personel-sifreleri` },
        { label: 'Avans Sorgulama', href: () => `/admin-panel/proje/${id}/sorgulama/avans` },
        { label: 'Kesinti Sorgulama', href: () => `/admin-panel/proje/${id}/sorgulama/kesinti` },
        { label: 'Yevmiye Sorgulama', href: () => `/admin-panel/proje/${id}/sorgulama/yevmiye` },
        { label: 'Asgari Sorgulama', href: () => `/admin-panel/proje/${id}/sorgulama/asgari` },
      ],
    },
    {
      id: 'raporlar',
      label: 'Raporlar',
      links: [
        { label: 'Admin Raporları', href: () => `/admin-panel/proje/${id}/raporlar` },
        { label: 'Günlük Onaylananlar', href: () => `/admin-panel/proje/${id}/raporlar/onaylanan` },
        { label: 'Onaylanmayanlar', href: () => `/admin-panel/proje/${id}/raporlar/onaysiz` },
        { label: 'Personel İtirazları', href: () => `/admin-panel/proje/${id}/itirazlar` },
      ],
    },
    {
      id: 'finans',
      label: 'Finans',
      links: [
        { label: 'Ne durumdayız?', href: () => `/admin-panel/proje/${id}/durum` },
        { label: 'Maaş Bordroları', href: () => `/admin-panel/proje/${id}/bordro` },
        { label: 'Maaş Politikası', href: () => `/admin-panel/proje/${id}/maas-politikasi` },
        { label: 'Taşeron Karı', href: () => `/admin-panel/proje/${id}/kar` },
        { label: 'Bloklar', href: () => `/admin-panel/proje/${id}/bloklar` },
        { label: 'Ekipler', href: () => `/admin-panel/proje/${id}/ekiplar` },
      ],
    },
  ];
}
