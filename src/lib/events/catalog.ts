export type CatalogDay = {
  id: string;
  label: string;
  date: string;
};

export type CatalogActivity = {
  id: string;
  dayId: string;
  title: string;
  startsAt?: string;
};

export type CatalogEventStatus =
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'completed';

export type CatalogEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  startsAtIso: string;
  endsAtIso: string;
  capacity: number;
  status: CatalogEventStatus;
  statusLabel: string;
  registrationDeadlineIso: string;
  assignedToStaff: boolean;
  registrationPrefix: string;
  days: CatalogDay[];
  activities: CatalogActivity[];
};

export const STATUS_LABELS: Record<CatalogEventStatus, string> = {
  published: 'Yayında',
  registration_open: 'Kayıt açık',
  registration_closed: 'Kayıt kapalı',
  completed: 'Tamamlandı',
};

export function formatTrDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function slugifyEventId(title: string) {
  const base = title
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'etkinlik'}-${Date.now().toString(36)}`;
}

/** Seed catalog — runtime mutations live in catalog-store. */
export const EVENT_CATALOG_SEED: CatalogEvent[] = [
  {
    id: 'abana-2027',
    title: 'Abana 2027',
    description:
      'Turizm Fakültesi öğrenci gezisi. Kayıt sonrası check-in QR kodun oluşur; etkinlik günü görevliye gösterirsin.',
    location: 'Abana, Kastamonu',
    startsAt: '12 Mayıs 2027',
    endsAt: '14 Mayıs 2027',
    startsAtIso: '2027-05-12T09:00:00+03:00',
    endsAtIso: '2027-05-14T18:00:00+03:00',
    capacity: 120,
    status: 'registration_open',
    statusLabel: 'Kayıt açık',
    registrationDeadlineIso: '2027-05-01T23:59:59+03:00',
    assignedToStaff: true,
    registrationPrefix: 'ABN-2027',
    days: [
      { id: 'abana-d1', label: 'Gün 1', date: '12 Mayıs 2027' },
      { id: 'abana-d2', label: 'Gün 2', date: '13 Mayıs 2027' },
      { id: 'abana-d3', label: 'Gün 3', date: '14 Mayıs 2027' },
    ],
    activities: [
      { id: 'abana-a1', dayId: 'abana-d1', title: 'Kalkış ve yol', startsAt: '08:00' },
      { id: 'abana-a2', dayId: 'abana-d1', title: 'Sahil yürüyüşü', startsAt: '15:00' },
      { id: 'abana-a3', dayId: 'abana-d2', title: 'Kültür gezisi', startsAt: '10:00' },
      { id: 'abana-a4', dayId: 'abana-d3', title: 'Dönüş', startsAt: '14:00' },
    ],
  },
  {
    id: 'tanisma-2026',
    title: 'Turizm Fakültesi Tanışma',
    description: 'Yeni dönem tanışma etkinliği. Tek günlük program; kayıt sonrası QR ile yoklama alınır.',
    location: 'Kastamonu Üniversitesi',
    startsAt: '18 Ekim 2026',
    endsAt: '18 Ekim 2026',
    startsAtIso: '2026-10-18T13:00:00+03:00',
    endsAtIso: '2026-10-18T17:00:00+03:00',
    capacity: 200,
    status: 'published',
    statusLabel: 'Yayında',
    registrationDeadlineIso: '2026-10-17T23:59:59+03:00',
    assignedToStaff: false,
    registrationPrefix: 'TNS-2026',
    days: [{ id: 'tanisma-d1', label: 'Etkinlik günü', date: '18 Ekim 2026' }],
    activities: [
      { id: 'tanisma-a1', dayId: 'tanisma-d1', title: 'Açılış ve tanışma', startsAt: '13:00' },
      { id: 'tanisma-a2', dayId: 'tanisma-d1', title: 'Atölye', startsAt: '15:00' },
    ],
  },
];

/** Static seed snapshot — runtime list is managed by catalog-store. */
export const EVENT_CATALOG = EVENT_CATALOG_SEED;
