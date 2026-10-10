import { emptyPlanning, type EventPlanning } from '@/lib/events/planning';

export type { CostBearer, EventMealPlan, EventPlanning, MealSlot } from '@/lib/events/planning';
export {
  COST_BEARER_LABELS,
  MEAL_SLOT_LABELS,
  emptyPlanning,
  formatFeeTry,
  normalizePlanning,
} from '@/lib/events/planning';

export type CatalogDay = {
  id: string;
  label: string;
  date: string;
  /** ISO datetime used when editing the program in admin */
  dateIso?: string;
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

/** Ordered staff scan stages (bus boarding, venue entry, …). */
export type EventCheckCard = {
  id: string;
  name: string;
};

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
  planning: EventPlanning;
  /** Named check cards students show in order; staff scan advances to the next. */
  checkCards: EventCheckCard[];
};

/** Normalize admin input; empty list becomes a single default “Giriş” card. */
export function normalizeCheckCards(
  eventId: string,
  cards: Array<{ id?: string; name?: string }> | null | undefined
): EventCheckCard[] {
  const named = (Array.isArray(cards) ? cards : [])
    .map((card, index) => ({
      id: card.id?.trim() || `${eventId}-cc${index + 1}`,
      name: (card.name ?? '').trim(),
    }))
    .filter((card) => card.name.length > 0)
    .map((card, index) => ({
      id: card.id || `${eventId}-cc${index + 1}`,
      name: card.name,
    }));
  if (named.length === 0) {
    return [{ id: `${eventId}-cc1`, name: 'Giriş' }];
  }
  return named;
}

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

const ABANA_PLANNING: EventPlanning = {
  pricing: {
    feeAmount: 850,
    currency: 'TRY',
    feeNotes: 'Katılım ücreti kayıt onayından sonra 7 gün içinde yatırılır.',
    includes: ['Gidiş-dönüş otobüs', '2 gece konaklama', 'Kahvaltı ve öğle yemeği', 'Rehberli kültür gezisi'],
  },
  transport: {
    provided: true,
    mode: 'Otobüs',
    departurePlace: 'Kastamonu Üniversitesi Kuzey Kampüs',
    arrivalPlace: 'Abana Merkez',
    durationText: 'Yaklaşık 3 saat 30 dk',
    feeAmount: 0,
    feeBearer: 'organizer',
    notes: 'Kalkış 08:00. Bagaj için orta boy valiz yeterlidir.',
  },
  accommodation: {
    provided: true,
    placeName: 'Abana Öğrenci Kampı / pansiyon',
    nights: 2,
    roomInfo: '4 kişilik odalar, havlu ve sabun sağlanır',
    feeBearer: 'organizer',
    checkInText: '12 Mayıs 16:00',
    checkOutText: '14 Mayıs 11:00',
    notes: 'Konaklama organizasyon tarafından karşılanır.',
  },
  meals: [
    { dayIndex: 0, slot: 'lunch', providedBy: 'organizer', menu: 'Paket öğle yemeği (yolda)', notes: '' },
    { dayIndex: 0, slot: 'dinner', providedBy: 'participant', menu: 'Serbest — sahil restoranları', notes: 'Kendi ödemeniz' },
    { dayIndex: 1, slot: 'breakfast', providedBy: 'organizer', menu: 'Açık büfe kahvaltı', notes: '' },
    { dayIndex: 1, slot: 'lunch', providedBy: 'organizer', menu: 'Balık + salata menüsü', notes: '' },
    { dayIndex: 1, slot: 'dinner', providedBy: 'shared', menu: 'Ortak sofra / mangal', notes: 'Malzeme sponsor desteği' },
    { dayIndex: 2, slot: 'breakfast', providedBy: 'organizer', menu: 'Açık büfe kahvaltı', notes: '' },
    { dayIndex: 2, slot: 'lunch', providedBy: 'organizer', menu: 'Dönüş paketi', notes: '' },
  ],
  team: {
    projectAdvisor: {
      name: 'Dr. Ayşe Demir',
      title: 'Proje danışmanı',
      contact: 'ornek.danisman@kastamonu.edu.tr',
    },
    organizers: [
      { name: 'Mehmet Kaya', role: 'Öğrenci koordinatörü' },
      { name: 'Zeynep Yılmaz', role: 'Lojistik sorumlusu' },
    ],
    emergencyContact: '0XXX XXX XX XX (görevli hattı)',
  },
  sponsors: [
    { name: 'Turizm Fakültesi Öğrenci Kulübü', contribution: 'Organizasyon desteği', url: '' },
    { name: 'Yerel işletme sponsoru', contribution: 'Ara öğün ikramı', url: '' },
  ],
  requirements: {
    documents: ['Öğrenci kimliği', 'Veli izin formu (18 yaş altı)'],
    equipment: 'Rahat yürüyüş ayakkabısı, yağmurluk, kişisel ilaçlar',
    dressCode: 'Gündüz gezileri için rahat kıyafet',
    otherNotes: 'Alkol taşınması yasaktır. Check-in QR kodunu yanınızda bulundurun.',
  },
  meetingPoint: 'Kuzey Kampüs otobüs durağının önü, 07:45',
};

const TANISMA_PLANNING: EventPlanning = {
  ...emptyPlanning(),
  pricing: {
    feeAmount: null,
    currency: 'TRY',
    feeNotes: 'Ücretsiz kampüs etkinliği',
    includes: ['İkram', 'Atölye malzemeleri'],
  },
  meals: [
    {
      dayIndex: 0,
      slot: 'snack',
      providedBy: 'organizer',
      menu: 'Çay / kahve ve küçük ikram',
      notes: '',
    },
  ],
  team: {
    projectAdvisor: { name: 'Fakülte Dekanlığı', title: 'Destek', contact: '' },
    organizers: [{ name: 'Öğrenci Konseyi', role: 'Organizasyon' }],
    emergencyContact: '',
  },
  meetingPoint: 'Fakülte konferans salonu girişi',
};

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
      { id: 'abana-d1', label: 'Gün 1', date: '12 Mayıs 2027', dateIso: '2027-05-12T09:00:00+03:00' },
      { id: 'abana-d2', label: 'Gün 2', date: '13 Mayıs 2027', dateIso: '2027-05-13T09:00:00+03:00' },
      { id: 'abana-d3', label: 'Gün 3', date: '14 Mayıs 2027', dateIso: '2027-05-14T09:00:00+03:00' },
    ],
    activities: [
      { id: 'abana-a1', dayId: 'abana-d1', title: 'Kalkış ve yol', startsAt: '08:00' },
      { id: 'abana-a2', dayId: 'abana-d1', title: 'Sahil yürüyüşü', startsAt: '15:00' },
      { id: 'abana-a3', dayId: 'abana-d2', title: 'Kültür gezisi', startsAt: '10:00' },
      { id: 'abana-a4', dayId: 'abana-d3', title: 'Dönüş', startsAt: '14:00' },
    ],
    planning: ABANA_PLANNING,
    checkCards: [
      { id: 'abana-cc1', name: 'Otobüs bineceği' },
      { id: 'abana-cc2', name: 'Konaklama giriş' },
      { id: 'abana-cc3', name: 'Etkinlik alan giriş' },
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
    days: [{ id: 'tanisma-d1', label: 'Etkinlik günü', date: '18 Ekim 2026', dateIso: '2026-10-18T13:00:00+03:00' }],
    activities: [
      { id: 'tanisma-a1', dayId: 'tanisma-d1', title: 'Açılış ve tanışma', startsAt: '13:00' },
      { id: 'tanisma-a2', dayId: 'tanisma-d1', title: 'Atölye', startsAt: '15:00' },
    ],
    planning: TANISMA_PLANNING,
    checkCards: [{ id: 'tanisma-cc1', name: 'Giriş' }],
  },
];

/** Static seed snapshot — runtime list is managed by catalog-store. */
export const EVENT_CATALOG = EVENT_CATALOG_SEED;
