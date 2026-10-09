'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import type { CatalogEvent, CatalogEventStatus, CostBearer, EventPlanning, MealSlot } from '@/lib/events/catalog';
import {
  COST_BEARER_LABELS,
  MEAL_SLOT_LABELS,
  STATUS_LABELS,
  emptyPlanning,
} from '@/lib/events/catalog';

type AdminEvent = CatalogEvent & { registeredCount?: number };
type DayDraft = { label: string; dateIso: string };
type ActivityDraft = { dayIndex: number; title: string; startsAt: string };
type FormState = {
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
  days: DayDraft[];
  activities: ActivityDraft[];
  planning: EventPlanning;
};

const SECTION_NAV = [
  { id: 'sec-1', label: 'Temel bilgiler' },
  { id: 'sec-2', label: 'Tarih ve kontenjan' },
  { id: 'sec-3', label: 'Program günleri' },
  { id: 'sec-4', label: 'Aktiviteler' },
  { id: 'sec-5', label: 'Ücret ve dahil olanlar' },
  { id: 'sec-6', label: 'Ulaşım' },
  { id: 'sec-7', label: 'Konaklama' },
  { id: 'sec-8', label: 'Yemek planı' },
  { id: 'sec-9', label: 'Ekip ve danışman' },
  { id: 'sec-10', label: 'Sponsorlar' },
  { id: 'sec-11', label: 'Katılım şartları' },
  { id: 'sec-12', label: 'Yayın durumu' },
] as const;

const sectionClass =
  'scroll-mt-28 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:scroll-mt-32 sm:p-5 lg:scroll-mt-28';

const emptyForm: FormState = {
  title: '',
  description: '',
  location: '',
  startsAtIso: '',
  endsAtIso: '',
  capacity: 100,
  status: 'registration_open',
  registrationDeadlineIso: '',
  assignedToStaff: true,
  registrationPrefix: '',
  days: [{ label: 'Gün 1', dateIso: '' }],
  activities: [{ dayIndex: 0, title: '', startsAt: '' }],
  planning: emptyPlanning(),
};

function toLocalInput(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function eventToForm(event: AdminEvent): FormState {
  const dayIndexById = new Map(event.days.map((day, index) => [day.id, index]));
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    startsAtIso: toLocalInput(event.startsAtIso),
    endsAtIso: toLocalInput(event.endsAtIso),
    capacity: event.capacity,
    status: event.status,
    registrationDeadlineIso: toLocalInput(event.registrationDeadlineIso),
    assignedToStaff: event.assignedToStaff,
    registrationPrefix: event.registrationPrefix,
    days: event.days.map((day) => ({
      label: day.label,
      dateIso: toLocalInput(day.dateIso || event.startsAtIso),
    })),
    activities:
      event.activities.length > 0
        ? event.activities.map((activity) => ({
            dayIndex: dayIndexById.get(activity.dayId) ?? 0,
            title: activity.title,
            startsAt: activity.startsAt ?? '',
          }))
        : [{ dayIndex: 0, title: '', startsAt: '' }],
    planning: event.planning ?? emptyPlanning(),
  };
}

function CostBearerSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CostBearer;
  onChange: (value: CostBearer) => void;
}) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value as CostBearer)}>
      {(Object.keys(COST_BEARER_LABELS) as CostBearer[]).map((key) => (
        <option key={key} value={key}>
          {COST_BEARER_LABELS[key]}
        </option>
      ))}
    </select>
  );
}

export function AdminEventForm({
  mode,
  eventId,
  event,
}: {
  mode: 'create' | 'edit';
  eventId?: string;
  event?: AdminEvent;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => (event ? eventToForm(event) : emptyForm));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const prefixHint = useMemo(() => {
    const letters = form.title
      .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((w) => w[0]?.toLocaleUpperCase('tr-TR') ?? '')
      .join('');
    const year = form.startsAtIso ? new Date(form.startsAtIso).getFullYear() : new Date().getFullYear();
    return letters ? `${letters}-${year}` : `EVT-${year}`;
  }, [form.title, form.startsAtIso]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchPlanning(updater: (prev: EventPlanning) => EventPlanning) {
    setForm((prev) => ({ ...prev, planning: updater(prev.planning) }));
  }

  function removeDay(index: number) {
    patch(
      'days',
      form.days.filter((_, i) => i !== index)
    );
    patch(
      'activities',
      form.activities
        .filter((item) => item.dayIndex !== index)
        .map((item) => ({
          ...item,
          dayIndex: item.dayIndex > index ? item.dayIndex - 1 : item.dayIndex,
        }))
    );
    patchPlanning((planning) => ({
      ...planning,
      meals: planning.meals
        .filter((meal) => meal.dayIndex !== index)
        .map((meal) => ({
          ...meal,
          dayIndex: meal.dayIndex > index ? meal.dayIndex - 1 : meal.dayIndex,
        })),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        ...(mode === 'edit' && eventId ? { id: eventId } : {}),
        ...form,
        startsAtIso: fromLocalInput(form.startsAtIso),
        endsAtIso: fromLocalInput(form.endsAtIso),
        registrationDeadlineIso: fromLocalInput(form.registrationDeadlineIso),
        registrationPrefix: form.registrationPrefix.trim() || prefixHint,
        days: form.days.map((day) => ({
          label: day.label,
          dateIso: fromLocalInput(day.dateIso) || fromLocalInput(form.startsAtIso),
        })),
        activities: form.activities.filter((item) => item.title.trim()),
        planning: {
          ...form.planning,
          pricing: {
            ...form.planning.pricing,
            includes: form.planning.pricing.includes.filter((item) => item.trim()),
          },
          team: {
            ...form.planning.team,
            organizers: form.planning.team.organizers.filter((org) => org.name.trim()),
          },
          sponsors: form.planning.sponsors.filter((sponsor) => sponsor.name.trim()),
          requirements: {
            ...form.planning.requirements,
            documents: form.planning.requirements.documents.filter((doc) => doc.trim()),
          },
          meals: form.planning.meals.filter((meal) => meal.menu.trim() || meal.notes.trim()),
        },
      };
      const response = await fetch('/api/admin/events', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? (mode === 'edit' ? 'Güncellenemedi' : 'Oluşturulamadı'));
        return;
      }
      router.push('/admin/events');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const { planning } = form;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Desktop: aside stretches with form so sticky has room to stay on screen */}
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav
            className="sticky top-[calc(5rem+env(safe-area-inset-top))] z-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
            aria-label="Form bölümleri"
          >
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Bölümler
            </p>
            <ul className="space-y-0.5">
              {SECTION_NAV.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-slate-600 transition hover:bg-[#e8f0ff] hover:text-[#0E1548]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-[#0E1548]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 truncate font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <form
          onSubmit={onSubmit}
          className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-br from-[#0E1548] to-[#2D6AF6] px-4 py-3.5 text-white sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {mode === 'edit' ? 'Düzenleme' : 'Yeni kayıt'}
            </p>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight sm:text-xl">
              {mode === 'edit' ? 'Etkinliği düzenle' : 'Etkinlik oluştur'}
            </h1>
            <p className="mt-0.5 max-w-xl text-xs text-white/75">
              Program, lojistik, yemek, ekip ve ücret bilgisini detaylı planla.
            </p>
          </div>

          <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-7">
          <section id="sec-1" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">1 · Temel bilgiler</h2>
            <div>
              <label htmlFor="title" className={labelClass}>Başlık</label>
              <input id="title" required className={inputClass} value={form.title} onChange={(e) => patch('title', e.target.value)} placeholder="Abana 2028" />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Açıklama</label>
              <textarea id="description" rows={3} className={inputClass} value={form.description} onChange={(e) => patch('description', e.target.value)} placeholder="Öğrencinin göreceği kısa tanıtım" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className={labelClass}>Konum</label>
                <input id="location" required className={inputClass} value={form.location} onChange={(e) => patch('location', e.target.value)} placeholder="Abana, Kastamonu" />
              </div>
              <div>
                <label htmlFor="prefix" className={labelClass}>Kayıt öneki</label>
                <input id="prefix" className={inputClass} value={form.registrationPrefix} onChange={(e) => patch('registrationPrefix', e.target.value.toUpperCase())} placeholder={prefixHint} />
              </div>
            </div>
          </section>

          <section id="sec-2" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">2 · Tarih ve kontenjan</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label htmlFor="starts" className={labelClass}>Başlangıç</label>
                <input
                  id="starts"
                  type="datetime-local"
                  required
                  className={inputClass}
                  value={form.startsAtIso}
                  onChange={(e) => {
                    patch('startsAtIso', e.target.value);
                    if (!form.days[0]?.dateIso) {
                      const next = [...form.days];
                      next[0] = { ...next[0], dateIso: e.target.value };
                      patch('days', next);
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="ends" className={labelClass}>Bitiş</label>
                <input id="ends" type="datetime-local" required className={inputClass} value={form.endsAtIso} onChange={(e) => patch('endsAtIso', e.target.value)} />
              </div>
              <div>
                <label htmlFor="deadline" className={labelClass}>Kayıt son tarihi</label>
                <input id="deadline" type="datetime-local" required className={inputClass} value={form.registrationDeadlineIso} onChange={(e) => patch('registrationDeadlineIso', e.target.value)} />
              </div>
              <div>
                <label htmlFor="capacity" className={labelClass}>Kontenjan</label>
                <input id="capacity" type="number" min={1} required className={inputClass} value={form.capacity} onChange={(e) => patch('capacity', Number(e.target.value))} />
              </div>
            </div>
          </section>

          <section id="sec-3" className={sectionClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0E1548]">3 · Program günleri</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                onClick={() => patch('days', [...form.days, { label: `Gün ${form.days.length + 1}`, dateIso: form.startsAtIso }])}
              >
                <FiPlus className="h-4 w-4" /> Gün ekle
              </button>
            </div>
            <div className="space-y-2">
              {form.days.map((day, index) => (
                <div key={index} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClass} value={day.label} onChange={(e) => { const next = [...form.days]; next[index] = { ...day, label: e.target.value }; patch('days', next); }} placeholder="Gün 1" />
                  <input type="datetime-local" className={inputClass} value={day.dateIso} onChange={(e) => { const next = [...form.days]; next[index] = { ...day, dateIso: e.target.value }; patch('days', next); }} />
                  <button
                    type="button"
                    disabled={form.days.length === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500 disabled:opacity-40"
                    onClick={() => removeDay(index)}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="sec-4" className={sectionClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0E1548]">4 · Aktiviteler</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                onClick={() => patch('activities', [...form.activities, { dayIndex: 0, title: '', startsAt: '' }])}
              >
                <FiPlus className="h-4 w-4" /> Aktivite ekle
              </button>
            </div>
            <div className="space-y-2">
              {form.activities.map((activity, index) => (
                <div key={index} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[7rem_1fr_6rem_auto]">
                  <select className={inputClass} value={activity.dayIndex} onChange={(e) => { const next = [...form.activities]; next[index] = { ...activity, dayIndex: Number(e.target.value) }; patch('activities', next); }}>
                    {form.days.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>{day.label || `Gün ${dayIndex + 1}`}</option>
                    ))}
                  </select>
                  <input className={inputClass} value={activity.title} onChange={(e) => { const next = [...form.activities]; next[index] = { ...activity, title: e.target.value }; patch('activities', next); }} placeholder="Aktivite adı" />
                  <input className={inputClass} value={activity.startsAt} onChange={(e) => { const next = [...form.activities]; next[index] = { ...activity, startsAt: e.target.value }; patch('activities', next); }} placeholder="10:00" />
                  <button type="button" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500" onClick={() => patch('activities', form.activities.filter((_, i) => i !== index))}>
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="sec-5" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">5 · Ücret ve dahil olanlar</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="feeAmount" className={labelClass}>Katılım ücreti (TRY)</label>
                <input
                  id="feeAmount"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={planning.pricing.feeAmount ?? ''}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      pricing: {
                        ...p.pricing,
                        feeAmount: e.target.value === '' ? null : Number(e.target.value),
                      },
                    }))
                  }
                  placeholder="Boş = ücretsiz"
                />
              </div>
              <div>
                <label htmlFor="feeNotes" className={labelClass}>Ücret notu</label>
                <input
                  id="feeNotes"
                  className={inputClass}
                  value={planning.pricing.feeNotes}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      pricing: { ...p.pricing, feeNotes: e.target.value },
                    }))
                  }
                  placeholder="Ödeme süresi, IBAN bilgisi vb."
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={labelClass}>Ücrete dahil</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                  onClick={() =>
                    patchPlanning((p) => ({
                      ...p,
                      pricing: { ...p.pricing, includes: [...p.pricing.includes, ''] },
                    }))
                  }
                >
                  <FiPlus className="h-4 w-4" /> Madde ekle
                </button>
              </div>
              {planning.pricing.includes.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={item}
                    onChange={(e) => {
                      const includes = [...planning.pricing.includes];
                      includes[index] = e.target.value;
                      patchPlanning((p) => ({ ...p, pricing: { ...p.pricing, includes } }));
                    }}
                    placeholder="Örn. gidiş-dönüş otobüs"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                    onClick={() =>
                      patchPlanning((p) => ({
                        ...p,
                        pricing: {
                          ...p.pricing,
                          includes: p.pricing.includes.filter((_, i) => i !== index),
                        },
                      }))
                    }
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="sec-6" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">6 · Ulaşım</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={planning.transport.provided}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    transport: { ...p.transport, provided: e.target.checked },
                  }))
                }
              />
              Organizasyon ulaşım sağlar
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="transportMode" className={labelClass}>Araç / tür</label>
                <input
                  id="transportMode"
                  className={inputClass}
                  value={planning.transport.mode}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: { ...p.transport, mode: e.target.value },
                    }))
                  }
                  placeholder="Otobüs"
                />
              </div>
              <div>
                <label htmlFor="transportDuration" className={labelClass}>Süre</label>
                <input
                  id="transportDuration"
                  className={inputClass}
                  value={planning.transport.durationText}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: { ...p.transport, durationText: e.target.value },
                    }))
                  }
                  placeholder="3 saat 30 dk"
                />
              </div>
              <div>
                <label htmlFor="departure" className={labelClass}>Kalkış</label>
                <input
                  id="departure"
                  className={inputClass}
                  value={planning.transport.departurePlace}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: { ...p.transport, departurePlace: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="arrival" className={labelClass}>Varış</label>
                <input
                  id="arrival"
                  className={inputClass}
                  value={planning.transport.arrivalPlace}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: { ...p.transport, arrivalPlace: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="transportFee" className={labelClass}>Ulaşım ücreti (TRY)</label>
                <input
                  id="transportFee"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={planning.transport.feeAmount ?? ''}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: {
                        ...p.transport,
                        feeAmount: e.target.value === '' ? null : Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="transportBearer" className={labelClass}>Kim öder</label>
                <CostBearerSelect
                  id="transportBearer"
                  value={planning.transport.feeBearer}
                  onChange={(feeBearer) =>
                    patchPlanning((p) => ({
                      ...p,
                      transport: { ...p.transport, feeBearer },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="transportNotes" className={labelClass}>Not</label>
              <textarea
                id="transportNotes"
                rows={2}
                className={inputClass}
                value={planning.transport.notes}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    transport: { ...p.transport, notes: e.target.value },
                  }))
                }
              />
            </div>
          </section>

          <section id="sec-7" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">7 · Konaklama</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={planning.accommodation.provided}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    accommodation: { ...p.accommodation, provided: e.target.checked },
                  }))
                }
              />
              Organizasyon konaklama sağlar
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="placeName" className={labelClass}>Yer</label>
                <input
                  id="placeName"
                  className={inputClass}
                  value={planning.accommodation.placeName}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: { ...p.accommodation, placeName: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="nights" className={labelClass}>Gece sayısı</label>
                <input
                  id="nights"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={planning.accommodation.nights ?? ''}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: {
                        ...p.accommodation,
                        nights: e.target.value === '' ? null : Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="roomInfo" className={labelClass}>Oda bilgisi</label>
                <input
                  id="roomInfo"
                  className={inputClass}
                  value={planning.accommodation.roomInfo}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: { ...p.accommodation, roomInfo: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="accBearer" className={labelClass}>Kim karşılar</label>
                <CostBearerSelect
                  id="accBearer"
                  value={planning.accommodation.feeBearer}
                  onChange={(feeBearer) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: { ...p.accommodation, feeBearer },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="checkIn" className={labelClass}>Giriş</label>
                <input
                  id="checkIn"
                  className={inputClass}
                  value={planning.accommodation.checkInText}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: { ...p.accommodation, checkInText: e.target.value },
                    }))
                  }
                  placeholder="12 Mayıs 16:00"
                />
              </div>
              <div>
                <label htmlFor="checkOut" className={labelClass}>Çıkış</label>
                <input
                  id="checkOut"
                  className={inputClass}
                  value={planning.accommodation.checkOutText}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      accommodation: { ...p.accommodation, checkOutText: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="accNotes" className={labelClass}>Not</label>
              <textarea
                id="accNotes"
                rows={2}
                className={inputClass}
                value={planning.accommodation.notes}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    accommodation: { ...p.accommodation, notes: e.target.value },
                  }))
                }
              />
            </div>
          </section>

          <section id="sec-8" className={sectionClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0E1548]">8 · Yemek planı</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                onClick={() =>
                  patchPlanning((p) => ({
                    ...p,
                    meals: [
                      ...p.meals,
                      { dayIndex: 0, slot: 'lunch', providedBy: 'organizer', menu: '', notes: '' },
                    ],
                  }))
                }
              >
                <FiPlus className="h-4 w-4" /> Öğün ekle
              </button>
            </div>
            <div className="space-y-2">
              {planning.meals.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz öğün yok. Günlük menü ve kimin karşıladığını ekle.</p>
              ) : null}
              {planning.meals.map((meal, index) => (
                <div key={index} className="grid gap-2 rounded-2xl bg-white p-3 sm:grid-cols-[7rem_7rem_8rem_1fr_auto]">
                  <select
                    className={inputClass}
                    value={meal.dayIndex}
                    onChange={(e) => {
                      const meals = [...planning.meals];
                      meals[index] = { ...meal, dayIndex: Number(e.target.value) };
                      patchPlanning((p) => ({ ...p, meals }));
                    }}
                  >
                    {form.days.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>
                        {day.label || `Gün ${dayIndex + 1}`}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={meal.slot}
                    onChange={(e) => {
                      const meals = [...planning.meals];
                      meals[index] = { ...meal, slot: e.target.value as MealSlot };
                      patchPlanning((p) => ({ ...p, meals }));
                    }}
                  >
                    {(Object.keys(MEAL_SLOT_LABELS) as MealSlot[]).map((slot) => (
                      <option key={slot} value={slot}>
                        {MEAL_SLOT_LABELS[slot]}
                      </option>
                    ))}
                  </select>
                  <CostBearerSelect
                    id={`meal-bearer-${index}`}
                    value={meal.providedBy}
                    onChange={(providedBy) => {
                      const meals = [...planning.meals];
                      meals[index] = { ...meal, providedBy };
                      patchPlanning((p) => ({ ...p, meals }));
                    }}
                  />
                  <input
                    className={inputClass}
                    value={meal.menu}
                    onChange={(e) => {
                      const meals = [...planning.meals];
                      meals[index] = { ...meal, menu: e.target.value };
                      patchPlanning((p) => ({ ...p, meals }));
                    }}
                    placeholder="Menü"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                    onClick={() =>
                      patchPlanning((p) => ({
                        ...p,
                        meals: p.meals.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="sec-9" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">9 · Ekip ve danışman</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="advisorName" className={labelClass}>Proje danışmanı</label>
                <input
                  id="advisorName"
                  className={inputClass}
                  value={planning.team.projectAdvisor.name}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      team: {
                        ...p.team,
                        projectAdvisor: { ...p.team.projectAdvisor, name: e.target.value },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="advisorTitle" className={labelClass}>Unvan</label>
                <input
                  id="advisorTitle"
                  className={inputClass}
                  value={planning.team.projectAdvisor.title}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      team: {
                        ...p.team,
                        projectAdvisor: { ...p.team.projectAdvisor, title: e.target.value },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="advisorContact" className={labelClass}>İletişim</label>
                <input
                  id="advisorContact"
                  className={inputClass}
                  value={planning.team.projectAdvisor.contact}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      team: {
                        ...p.team,
                        projectAdvisor: { ...p.team.projectAdvisor, contact: e.target.value },
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="emergency" className={labelClass}>Acil iletişim</label>
              <input
                id="emergency"
                className={inputClass}
                value={planning.team.emergencyContact}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    team: { ...p.team, emergencyContact: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={labelClass}>Organizatörler</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                  onClick={() =>
                    patchPlanning((p) => ({
                      ...p,
                      team: {
                        ...p.team,
                        organizers: [...p.team.organizers, { name: '', role: '' }],
                      },
                    }))
                  }
                >
                  <FiPlus className="h-4 w-4" /> Ekle
                </button>
              </div>
              {planning.team.organizers.map((org, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    className={inputClass}
                    value={org.name}
                    onChange={(e) => {
                      const organizers = [...planning.team.organizers];
                      organizers[index] = { ...org, name: e.target.value };
                      patchPlanning((p) => ({ ...p, team: { ...p.team, organizers } }));
                    }}
                    placeholder="Ad"
                  />
                  <input
                    className={inputClass}
                    value={org.role}
                    onChange={(e) => {
                      const organizers = [...planning.team.organizers];
                      organizers[index] = { ...org, role: e.target.value };
                      patchPlanning((p) => ({ ...p, team: { ...p.team, organizers } }));
                    }}
                    placeholder="Rol"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                    onClick={() =>
                      patchPlanning((p) => ({
                        ...p,
                        team: {
                          ...p.team,
                          organizers: p.team.organizers.filter((_, i) => i !== index),
                        },
                      }))
                    }
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="sec-10" className={sectionClass}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0E1548]">10 · Sponsorlar</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                onClick={() =>
                  patchPlanning((p) => ({
                    ...p,
                    sponsors: [...p.sponsors, { name: '', contribution: '', url: '' }],
                  }))
                }
              >
                <FiPlus className="h-4 w-4" /> Sponsor ekle
              </button>
            </div>
            {planning.sponsors.map((sponsor, index) => (
              <div key={index} className="grid gap-2 rounded-2xl bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  className={inputClass}
                  value={sponsor.name}
                  onChange={(e) => {
                    const sponsors = [...planning.sponsors];
                    sponsors[index] = { ...sponsor, name: e.target.value };
                    patchPlanning((p) => ({ ...p, sponsors }));
                  }}
                  placeholder="Sponsor adı"
                />
                <input
                  className={inputClass}
                  value={sponsor.contribution}
                  onChange={(e) => {
                    const sponsors = [...planning.sponsors];
                    sponsors[index] = { ...sponsor, contribution: e.target.value };
                    patchPlanning((p) => ({ ...p, sponsors }));
                  }}
                  placeholder="Katkı"
                />
                <input
                  className={inputClass}
                  value={sponsor.url}
                  onChange={(e) => {
                    const sponsors = [...planning.sponsors];
                    sponsors[index] = { ...sponsor, url: e.target.value };
                    patchPlanning((p) => ({ ...p, sponsors }));
                  }}
                  placeholder="URL (isteğe bağlı)"
                />
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                  onClick={() =>
                    patchPlanning((p) => ({
                      ...p,
                      sponsors: p.sponsors.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          <section id="sec-11" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">11 · Katılım şartları</h2>
            <div>
              <label htmlFor="meetingPoint" className={labelClass}>Buluşma noktası</label>
              <input
                id="meetingPoint"
                className={inputClass}
                value={planning.meetingPoint}
                onChange={(e) =>
                  patchPlanning((p) => ({ ...p, meetingPoint: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={labelClass}>Gerekli belgeler</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                  onClick={() =>
                    patchPlanning((p) => ({
                      ...p,
                      requirements: {
                        ...p.requirements,
                        documents: [...p.requirements.documents, ''],
                      },
                    }))
                  }
                >
                  <FiPlus className="h-4 w-4" /> Belge ekle
                </button>
              </div>
              {planning.requirements.documents.map((doc, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={doc}
                    onChange={(e) => {
                      const documents = [...planning.requirements.documents];
                      documents[index] = e.target.value;
                      patchPlanning((p) => ({
                        ...p,
                        requirements: { ...p.requirements, documents },
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                    onClick={() =>
                      patchPlanning((p) => ({
                        ...p,
                        requirements: {
                          ...p.requirements,
                          documents: p.requirements.documents.filter((_, i) => i !== index),
                        },
                      }))
                    }
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="equipment" className={labelClass}>Ekipman</label>
                <textarea
                  id="equipment"
                  rows={2}
                  className={inputClass}
                  value={planning.requirements.equipment}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      requirements: { ...p.requirements, equipment: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label htmlFor="dressCode" className={labelClass}>Kıyafet</label>
                <textarea
                  id="dressCode"
                  rows={2}
                  className={inputClass}
                  value={planning.requirements.dressCode}
                  onChange={(e) =>
                    patchPlanning((p) => ({
                      ...p,
                      requirements: { ...p.requirements, dressCode: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="otherNotes" className={labelClass}>Diğer notlar</label>
              <textarea
                id="otherNotes"
                rows={2}
                className={inputClass}
                value={planning.requirements.otherNotes}
                onChange={(e) =>
                  patchPlanning((p) => ({
                    ...p,
                    requirements: { ...p.requirements, otherNotes: e.target.value },
                  }))
                }
              />
            </div>
          </section>

          <section id="sec-12" className={sectionClass}>
            <h2 className="text-sm font-semibold text-[#0E1548]">12 · Yayın durumu</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className={labelClass}>Durum</label>
                <select id="status" className={inputClass} value={form.status} onChange={(e) => patch('status', e.target.value as CatalogEventStatus)}>
                  {(Object.keys(STATUS_LABELS) as CatalogEventStatus[]).map((key) => (
                    <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                  ))}
                </select>
              </div>
              <label className="mt-7 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.assignedToStaff} onChange={(e) => patch('assignedToStaff', e.target.checked)} />
                Görevliye ata (check-in)
              </label>
            </div>
          </section>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="sticky bottom-3 z-[5] flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur sm:bottom-4">
            <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 sm:flex-none sm:min-w-[12rem]">
              {loading ? 'Kaydediliyor…' : mode === 'edit' ? 'Değişiklikleri kaydet' : 'Etkinliği oluştur'}
            </button>
            <Link href="/admin/events" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Vazgeç
            </Link>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
