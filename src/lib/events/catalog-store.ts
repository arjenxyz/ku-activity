import {
  EVENT_CATALOG_SEED,
  STATUS_LABELS,
  formatTrDate,
  slugifyEventId,
  type CatalogActivity,
  type CatalogDay,
  type CatalogEvent,
  type CatalogEventStatus,
} from '@/lib/events/catalog';

type Store = {
  events: CatalogEvent[];
};

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsEventCatalog?: Store };
  if (!g.__emsEventCatalog) {
    g.__emsEventCatalog = {
      events: structuredClone(EVENT_CATALOG_SEED),
    };
  }
  return g.__emsEventCatalog;
}

export function listCatalogEvents() {
  return store().events;
}

export function getCatalogEvent(id: string) {
  return store().events.find((event) => event.id === id) ?? null;
}

export function isRegistrationOpen(event: CatalogEvent, now = new Date()) {
  if (event.status !== 'registration_open' && event.status !== 'published') return false;
  return now.getTime() <= new Date(event.registrationDeadlineIso).getTime();
}

export type CreateCatalogEventInput = {
  title: string;
  description: string;
  location: string;
  startsAtIso: string;
  endsAtIso: string;
  capacity: number;
  status: CatalogEventStatus;
  registrationDeadlineIso: string;
  assignedToStaff: boolean;
  registrationPrefix: string;
  days: Array<{ label: string; dateIso: string }>;
  activities: Array<{ dayIndex: number; title: string; startsAt?: string }>;
};

export function createCatalogEvent(input: CreateCatalogEventInput): CatalogEvent {
  const title = input.title.trim();
  if (!title) throw new Error('Başlık gerekli');
  if (!input.location.trim()) throw new Error('Konum gerekli');
  if (!input.startsAtIso || !input.endsAtIso) throw new Error('Tarihler gerekli');
  if (new Date(input.endsAtIso) < new Date(input.startsAtIso)) {
    throw new Error('Bitiş, başlangıçtan önce olamaz');
  }
  if (!Number.isFinite(input.capacity) || input.capacity < 1) {
    throw new Error('Kontenjan en az 1 olmalı');
  }
  if (!input.registrationPrefix.trim()) throw new Error('Kayıt öneki gerekli');
  if (!input.days.length) throw new Error('En az bir gün ekle');

  const eventId = slugifyEventId(title);

  const days: CatalogDay[] = input.days.map((day, index) => ({
    id: `${eventId}-d${index + 1}`,
    label: day.label.trim() || `Gün ${index + 1}`,
    date: formatTrDate(day.dateIso),
  }));

  const activities: CatalogActivity[] = input.activities
    .filter((item) => item.title.trim())
    .map((item, index) => {
      const day = days[item.dayIndex];
      if (!day) throw new Error('Aktivite için geçersiz gün');
      return {
        id: `${eventId}-a${index + 1}`,
        dayId: day.id,
        title: item.title.trim(),
        startsAt: item.startsAt?.trim() || undefined,
      };
    });

  const event: CatalogEvent = {
    id: eventId,
    title,
    description: input.description.trim(),
    location: input.location.trim(),
    startsAt: formatTrDate(input.startsAtIso),
    endsAt: formatTrDate(input.endsAtIso),
    startsAtIso: input.startsAtIso,
    endsAtIso: input.endsAtIso,
    capacity: Math.floor(input.capacity),
    status: input.status,
    statusLabel: STATUS_LABELS[input.status],
    registrationDeadlineIso: input.registrationDeadlineIso,
    assignedToStaff: Boolean(input.assignedToStaff),
    registrationPrefix: input.registrationPrefix.trim().toUpperCase(),
    days,
    activities,
  };

  store().events = [event, ...store().events];
  return event;
}

export function updateCatalogEventStatus(id: string, status: CatalogEventStatus) {
  const event = getCatalogEvent(id);
  if (!event) throw new Error('Etkinlik bulunamadı');
  event.status = status;
  event.statusLabel = STATUS_LABELS[status];
  return event;
}
