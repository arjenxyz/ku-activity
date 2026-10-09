export type CostBearer = 'organizer' | 'participant' | 'shared' | 'sponsor' | 'none';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type EventMealPlan = {
  dayIndex: number;
  slot: MealSlot;
  providedBy: CostBearer;
  menu: string;
  notes: string;
};

export type EventPlanning = {
  pricing: {
    feeAmount: number | null;
    currency: 'TRY';
    feeNotes: string;
    includes: string[];
  };
  transport: {
    provided: boolean;
    mode: string;
    departurePlace: string;
    arrivalPlace: string;
    durationText: string;
    feeAmount: number | null;
    feeBearer: CostBearer;
    notes: string;
  };
  accommodation: {
    provided: boolean;
    placeName: string;
    nights: number | null;
    roomInfo: string;
    feeBearer: CostBearer;
    checkInText: string;
    checkOutText: string;
    notes: string;
  };
  meals: EventMealPlan[];
  team: {
    projectAdvisor: { name: string; title: string; contact: string };
    organizers: Array<{ name: string; role: string }>;
    emergencyContact: string;
  };
  sponsors: Array<{ name: string; contribution: string; url: string }>;
  requirements: {
    documents: string[];
    equipment: string;
    dressCode: string;
    otherNotes: string;
  };
  meetingPoint: string;
};

export const COST_BEARER_LABELS: Record<CostBearer, string> = {
  organizer: 'Organizasyon',
  participant: 'Katılımcı',
  shared: 'Paylaşımlı',
  sponsor: 'Sponsor',
  none: 'Yok / uygulanmaz',
};

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Ara öğün',
};

export function emptyPlanning(): EventPlanning {
  return {
    pricing: {
      feeAmount: null,
      currency: 'TRY',
      feeNotes: '',
      includes: [],
    },
    transport: {
      provided: false,
      mode: '',
      departurePlace: '',
      arrivalPlace: '',
      durationText: '',
      feeAmount: null,
      feeBearer: 'none',
      notes: '',
    },
    accommodation: {
      provided: false,
      placeName: '',
      nights: null,
      roomInfo: '',
      feeBearer: 'none',
      checkInText: '',
      checkOutText: '',
      notes: '',
    },
    meals: [],
    team: {
      projectAdvisor: { name: '', title: '', contact: '' },
      organizers: [],
      emergencyContact: '',
    },
    sponsors: [],
    requirements: {
      documents: [],
      equipment: '',
      dressCode: '',
      otherNotes: '',
    },
    meetingPoint: '',
  };
}

function asCostBearer(value: unknown): CostBearer {
  if (
    value === 'organizer' ||
    value === 'participant' ||
    value === 'shared' ||
    value === 'sponsor' ||
    value === 'none'
  ) {
    return value;
  }
  return 'none';
}

function asMealSlot(value: unknown): MealSlot {
  if (value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack') {
    return value;
  }
  return 'lunch';
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

/** Normalize arbitrary API/form payload into EventPlanning. */
export function normalizePlanning(raw: unknown): EventPlanning {
  const base = emptyPlanning();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<EventPlanning> & Record<string, unknown>;

  const pricing = (p.pricing ?? {}) as Partial<EventPlanning['pricing']>;
  const transport = (p.transport ?? {}) as Partial<EventPlanning['transport']>;
  const accommodation = (p.accommodation ?? {}) as Partial<EventPlanning['accommodation']>;
  const team = (p.team ?? {}) as Partial<EventPlanning['team']>;
  const advisor = (team.projectAdvisor ?? {}) as Partial<EventPlanning['team']['projectAdvisor']>;
  const requirements = (p.requirements ?? {}) as Partial<EventPlanning['requirements']>;

  const meals = Array.isArray(p.meals)
    ? p.meals.map((item) => {
        const meal = (item ?? {}) as Partial<EventMealPlan>;
        return {
          dayIndex: Math.max(0, Math.floor(Number(meal.dayIndex) || 0)),
          slot: asMealSlot(meal.slot),
          providedBy: asCostBearer(meal.providedBy),
          menu: asString(meal.menu),
          notes: asString(meal.notes),
        };
      })
    : [];

  const organizers = Array.isArray(team.organizers)
    ? team.organizers
        .map((item) => {
          const org = (item ?? {}) as { name?: string; role?: string };
          return { name: asString(org.name), role: asString(org.role) };
        })
        .filter((org) => org.name)
    : [];

  const sponsors = Array.isArray(p.sponsors)
    ? p.sponsors
        .map((item) => {
          const sponsor = (item ?? {}) as { name?: string; contribution?: string; url?: string };
          return {
            name: asString(sponsor.name),
            contribution: asString(sponsor.contribution),
            url: asString(sponsor.url),
          };
        })
        .filter((sponsor) => sponsor.name)
    : [];

  return {
    pricing: {
      feeAmount: asNumberOrNull(pricing.feeAmount),
      currency: 'TRY',
      feeNotes: asString(pricing.feeNotes),
      includes: asStringList(pricing.includes),
    },
    transport: {
      provided: Boolean(transport.provided),
      mode: asString(transport.mode),
      departurePlace: asString(transport.departurePlace),
      arrivalPlace: asString(transport.arrivalPlace),
      durationText: asString(transport.durationText),
      feeAmount: asNumberOrNull(transport.feeAmount),
      feeBearer: asCostBearer(transport.feeBearer),
      notes: asString(transport.notes),
    },
    accommodation: {
      provided: Boolean(accommodation.provided),
      placeName: asString(accommodation.placeName),
      nights: asNumberOrNull(accommodation.nights),
      roomInfo: asString(accommodation.roomInfo),
      feeBearer: asCostBearer(accommodation.feeBearer),
      checkInText: asString(accommodation.checkInText),
      checkOutText: asString(accommodation.checkOutText),
      notes: asString(accommodation.notes),
    },
    meals,
    team: {
      projectAdvisor: {
        name: asString(advisor.name),
        title: asString(advisor.title),
        contact: asString(advisor.contact),
      },
      organizers,
      emergencyContact: asString(team.emergencyContact),
    },
    sponsors,
    requirements: {
      documents: asStringList(requirements.documents),
      equipment: asString(requirements.equipment),
      dressCode: asString(requirements.dressCode),
      otherNotes: asString(requirements.otherNotes),
    },
    meetingPoint: asString(p.meetingPoint),
  };
}

export function formatFeeTry(amount: number | null): string {
  if (amount === null || amount === 0) return 'Ücretsiz';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}
