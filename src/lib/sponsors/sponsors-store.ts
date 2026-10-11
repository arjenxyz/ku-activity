export type StoredSponsor = {
  id: string;
  name: string;
  url: string | null;
  logoUrl: string | null;
  blurb: string | null;
  about: string | null;
  sortOrder: number;
  active: boolean;
};

type Store = {
  sponsors: StoredSponsor[];
};

const SEED: Array<Omit<StoredSponsor, 'id' | 'sortOrder' | 'active'>> = [
  {
    name: 'Abana Seyahat',
    url: 'https://example.com/abana-seyahat',
    logoUrl: '/sponsors/abana-seyahat.svg',
    blurb: 'Ulaşım sponsoru',
    about:
      'Etkinlik günü otobüs ve transfer organizasyonunu destekler. Rota ve saat bilgisini ekiple paylaşır.',
  },
  {
    name: 'Abana Belediyesi',
    url: 'https://example.com/abana-belediyesi',
    logoUrl: '/sponsors/abana-belediyesi.svg',
    blurb: 'Yerel destek',
    about:
      'Yerel izinler, alan kullanımı ve tanıtım konularında öğrenci etkinliklerine destek verir.',
  },
  {
    name: 'Kastamonu Turizm',
    url: 'https://example.com/kastamonu-turizm',
    logoUrl: '/sponsors/kastamonu-turizm.svg',
    blurb: 'Konaklama desteği',
    about: 'Konaklama ve turizm bilgilendirmesiyle gezi planlamasına katkı sağlar.',
  },
  {
    name: 'Karadeniz Lojistik',
    url: 'https://example.com/karadeniz-lojistik',
    logoUrl: '/sponsors/karadeniz-lojistik.svg',
    blurb: 'Lojistik',
    about: 'Malzeme taşıma ve saha lojistiği için operasyonel destek sunar.',
  },
  {
    name: 'Sahil Cafe',
    url: 'https://example.com/sahil-cafe',
    logoUrl: '/sponsors/sahil-cafe.svg',
    blurb: 'İkram',
    about: 'Ara öğün ve ikram desteğiyle katılımcı deneyimini güçlendirir.',
  },
];

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeUrl(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/') || raw.startsWith('data:')) return raw;
  return `https://${raw}`;
}

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsSponsorsV3?: Store };
  if (!g.__emsSponsorsV3) {
    g.__emsSponsorsV3 = {
      sponsors: SEED.map((row, index) => ({
        id: `sponsor_seed_${index + 1}`,
        name: row.name,
        url: row.url,
        logoUrl: row.logoUrl,
        blurb: row.blurb,
        about: row.about,
        sortOrder: index,
        active: true,
      })),
    };
  }
  return g.__emsSponsorsV3;
}

export function listPublicSponsors() {
  return store()
    .sponsors.filter((row) => row.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ ...row }));
}

export function listAllSponsors() {
  return store()
    .sponsors.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ ...row }));
}

export function createSponsor(input: {
  name: string;
  url?: string;
  logoUrl?: string;
  blurb?: string;
  about?: string;
}) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('İsim en az 2 karakter olmalı');
  if (
    store().sponsors.some(
      (row) => row.active && row.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')
    )
  ) {
    throw new Error('Bu sponsor zaten var');
  }
  const maxOrder = store().sponsors.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  const row: StoredSponsor = {
    id: uid('sponsor'),
    name,
    url: normalizeUrl(input.url),
    logoUrl: input.logoUrl?.trim() || null,
    blurb: input.blurb?.trim() || null,
    about: input.about?.trim() || null,
    sortOrder: maxOrder + 1,
    active: true,
  };
  store().sponsors.push(row);
  return { ...row };
}

export function updateSponsor(
  id: string,
  patch: Partial<Pick<StoredSponsor, 'name' | 'url' | 'logoUrl' | 'blurb' | 'about' | 'active'>>
) {
  const row = store().sponsors.find((item) => item.id === id);
  if (!row) throw new Error('Sponsor bulunamadı');
  if (patch.name != null) {
    const name = patch.name.trim();
    if (name.length < 2) throw new Error('İsim en az 2 karakter olmalı');
    if (
      store().sponsors.some(
        (item) =>
          item.id !== id &&
          item.active &&
          item.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr')
      )
    ) {
      throw new Error('Bu sponsor zaten var');
    }
    row.name = name;
  }
  if (patch.url !== undefined) row.url = normalizeUrl(patch.url);
  if (patch.logoUrl !== undefined) row.logoUrl = patch.logoUrl?.trim() || null;
  if (patch.blurb !== undefined) row.blurb = patch.blurb?.trim() || null;
  if (patch.about !== undefined) row.about = patch.about?.trim() || null;
  if (patch.active != null) row.active = patch.active;
  return { ...row };
}

export function removeSponsor(id: string) {
  const row = store().sponsors.find((item) => item.id === id);
  if (!row) throw new Error('Sponsor bulunamadı');
  row.active = false;
  return { ok: true };
}
