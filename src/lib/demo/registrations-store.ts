import {
  decryptCheckinToken,
  encryptCheckinToken,
  generateCheckinToken,
  generateManualCode,
  hashCheckinToken,
  isManualCheckinCode,
  normalizeManualCode,
} from '@/lib/checkin-token';
import { DEMO_CHECKIN_TOKEN } from '@/lib/demo/data';
import { normalizeCheckCards, type EventCheckCard } from '@/lib/events/catalog';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import type { AppRole } from '@/lib/auth/roles';

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';

export type DemoAttendance = {
  dayId: string | null;
  checkedInAt: string;
  checkedInBy: string;
};

export type DemoCheckCardScan = {
  checkCardId: string;
  checkedInAt: string;
  checkedInBy: string;
};

export type DemoRegistration = {
  id: string;
  eventId: string;
  ownerKey: string;
  ownerName: string;
  registrationNo: string;
  /** Short code shown under QR for offline/manual check-in */
  manualCode: string;
  tokenHash: string;
  tokenEncrypted: string;
  status: RegistrationStatus;
  logistics: {
    transport?: string;
    meal?: string;
    note?: string;
  };
  dayIds: string[];
  activityIds: string[];
  registeredAt: string;
  attendance: DemoAttendance[];
  /** Index of the check card the student should currently show. */
  checkCardIndex: number;
  checkCardScans: DemoCheckCardScan[];
};

export type CheckCardProgress = {
  index: number;
  total: number;
  completed: boolean;
  current: EventCheckCard | null;
  cards: EventCheckCard[];
};

type Store = {
  regs: Map<string, DemoRegistration>;
  seq: number;
};

function ensureRegFields(row: DemoRegistration) {
  if (!row.manualCode) row.manualCode = generateManualCode();
  if (typeof row.checkCardIndex !== 'number' || row.checkCardIndex < 0) {
    row.checkCardIndex = 0;
  }
  if (!Array.isArray(row.checkCardScans)) row.checkCardScans = [];
  return row;
}

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsRegStoreV2?: Store };
  if (!g.__emsRegStoreV2) {
    g.__emsRegStoreV2 = { regs: new Map(), seq: 184 };
    seed(g.__emsRegStoreV2);
  }
  for (const row of g.__emsRegStoreV2.regs.values()) {
    ensureRegFields(row);
  }
  return g.__emsRegStoreV2;
}

function seed(s: Store) {
  const encrypted = encryptCheckinToken(DEMO_CHECKIN_TOKEN);
  const row: DemoRegistration = {
    id: 'demo-reg-abana-ayse',
    eventId: 'abana-2027',
    ownerKey: 'student',
    ownerName: 'Ayşe Yılmaz',
    registrationNo: 'ABN-2027-000184',
    manualCode: 'EMS-7F3A9C',
    tokenHash: hashCheckinToken(DEMO_CHECKIN_TOKEN),
    tokenEncrypted: encrypted,
    status: 'confirmed',
    logistics: { transport: 'otobus', meal: 'standart' },
    dayIds: ['abana-d1', 'abana-d2', 'abana-d3'],
    activityIds: ['abana-a1', 'abana-a2'],
    registeredAt: '2026-10-02T10:00:00+03:00',
    attendance: [],
    checkCardIndex: 0,
    checkCardScans: [],
  };
  s.regs.set(row.id, row);
}

export function ownerKeyForRole(role: AppRole, emailHint?: string | null) {
  if (role === 'student') return emailHint?.toLowerCase() || 'student';
  return role;
}

export function listRegistrationsForOwner(ownerKey: string) {
  return [...store().regs.values()]
    .filter((row) => row.ownerKey === ownerKey || (ownerKey === 'student' && row.ownerKey === 'student'))
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}

export function getRegistration(id: string) {
  const row = store().regs.get(id) ?? null;
  return row ? ensureRegFields(row) : null;
}

export function findRegistrationByToken(token: string) {
  const hash = hashCheckinToken(token);
  const row = [...store().regs.values()].find((item) => item.tokenHash === hash) ?? null;
  return row ? ensureRegFields(row) : null;
}

export function findRegistrationByManualCode(code: string) {
  const normalized = normalizeManualCode(code);
  const row =
    [...store().regs.values()].find(
      (item) => normalizeManualCode(item.manualCode || '') === normalized
    ) ?? null;
  return row ? ensureRegFields(row) : null;
}

/** Resolve registration from scanned QR token or typed manual code. */
export function findRegistrationByCheckinInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isManualCheckinCode(trimmed)) {
    return findRegistrationByManualCode(trimmed);
  }
  return findRegistrationByToken(trimmed);
}

export function getRawToken(reg: DemoRegistration) {
  return decryptCheckinToken(reg.tokenEncrypted);
}

export function getCheckCardProgress(reg: DemoRegistration): CheckCardProgress {
  const event = getCatalogEvent(reg.eventId);
  const cards = normalizeCheckCards(reg.eventId, event?.checkCards);
  const index = Math.min(Math.max(0, reg.checkCardIndex ?? 0), cards.length);
  const completed = index >= cards.length;
  return {
    index,
    total: cards.length,
    completed,
    current: completed ? null : (cards[index] ?? null),
    cards,
  };
}

export function createRegistration(input: {
  eventId: string;
  ownerKey: string;
  ownerName: string;
  logistics: DemoRegistration['logistics'];
  dayIds: string[];
  activityIds: string[];
}) {
  const event = getCatalogEvent(input.eventId);
  if (!event) throw new Error('Etkinlik bulunamadı');

  const existing = [...store().regs.values()].find(
    (row) =>
      row.eventId === input.eventId &&
      row.ownerKey === input.ownerKey &&
      row.status !== 'cancelled'
  );
  if (existing) throw new Error('Bu etkinliğe zaten kayıtlısın');

  const s = store();
  s.seq += 1;
  const { tokenHash, tokenEncrypted } = generateCheckinToken();
  const row: DemoRegistration = {
    id: `demo-reg-${input.eventId}-${s.seq}`,
    eventId: input.eventId,
    ownerKey: input.ownerKey,
    ownerName: input.ownerName,
    registrationNo: `${event.registrationPrefix}-${String(s.seq).padStart(6, '0')}`,
    manualCode: generateManualCode(),
    tokenHash,
    tokenEncrypted,
    status: 'confirmed',
    logistics: input.logistics,
    dayIds: input.dayIds,
    activityIds: input.activityIds,
    registeredAt: new Date().toISOString(),
    attendance: [],
    checkCardIndex: 0,
    checkCardScans: [],
  };
  s.regs.set(row.id, row);
  return row;
}

export function cancelRegistration(id: string, ownerKey: string) {
  const row = store().regs.get(id);
  if (!row || row.ownerKey !== ownerKey) throw new Error('Kayıt bulunamadı');
  if (row.status === 'cancelled') return row;
  const event = getCatalogEvent(row.eventId);
  if (event && new Date() > new Date(event.registrationDeadlineIso)) {
    throw new Error('Kayıt son tarihi geçti; iptal için yöneticiye başvur');
  }
  row.status = 'cancelled';
  store().regs.set(id, row);
  return row;
}

export function recordCheckIn(input: {
  token: string;
  eventId: string;
  dayId: string | null;
  staffKey: string;
}) {
  const row = findRegistrationByCheckinInput(input.token);
  if (!row) throw new Error('QR / manuel kod tanınmadı');
  if (row.eventId !== input.eventId) throw new Error('Bu kod bu etkinliğe ait değil');
  if (row.status === 'cancelled') throw new Error('Kayıt iptal edilmiş');
  if (row.status === 'pending') throw new Error('Kayıt henüz onaylanmadı');

  const progress = getCheckCardProgress(row);
  const now = new Date().toISOString();

  if (progress.completed || !progress.current) {
    const lastScan = row.checkCardScans[row.checkCardScans.length - 1];
    return {
      registration: row,
      duplicate: true as const,
      completed: true as const,
      checkCard: progress.cards[progress.cards.length - 1] ?? null,
      nextCheckCard: null,
      attendance: lastScan
        ? {
            dayId: input.dayId,
            checkedInAt: lastScan.checkedInAt,
            checkedInBy: lastScan.checkedInBy,
          }
        : {
            dayId: input.dayId,
            checkedInAt: now,
            checkedInBy: input.staffKey,
          },
    };
  }

  const current = progress.current;
  const alreadyCard = row.checkCardScans.find((scan) => scan.checkCardId === current.id);
  if (alreadyCard) {
    row.checkCardIndex = Math.max(row.checkCardIndex, progress.index + 1);
    store().regs.set(row.id, row);
    const nextProgress = getCheckCardProgress(row);
    return {
      registration: row,
      duplicate: true as const,
      completed: nextProgress.completed,
      checkCard: current,
      nextCheckCard: nextProgress.current,
      attendance: {
        dayId: input.dayId,
        checkedInAt: alreadyCard.checkedInAt,
        checkedInBy: alreadyCard.checkedInBy,
      },
    };
  }

  const scan: DemoCheckCardScan = {
    checkCardId: current.id,
    checkedInAt: now,
    checkedInBy: input.staffKey,
  };
  row.checkCardScans.push(scan);
  row.checkCardIndex = progress.index + 1;

  const dayId = input.dayId;
  const alreadyDay = row.attendance.find((item) =>
    dayId ? item.dayId === dayId : item.dayId === null || item.dayId === dayId
  );
  let attendance: DemoAttendance;
  if (alreadyDay) {
    attendance = alreadyDay;
  } else {
    attendance = {
      dayId,
      checkedInAt: now,
      checkedInBy: input.staffKey,
    };
    row.attendance.push(attendance);
  }

  store().regs.set(row.id, row);
  const nextProgress = getCheckCardProgress(row);
  return {
    registration: row,
    duplicate: false as const,
    completed: nextProgress.completed,
    checkCard: current,
    nextCheckCard: nextProgress.current,
    attendance,
  };
}

export function listRegistrationsForEvent(eventId: string) {
  return [...store().regs.values()]
    .map(ensureRegFields)
    .filter((row) => row.eventId === eventId && row.status !== 'cancelled');
}
