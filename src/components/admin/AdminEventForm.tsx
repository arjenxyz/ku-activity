'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import type { CatalogEvent, CatalogEventStatus } from '@/lib/events/catalog';
import { STATUS_LABELS } from '@/lib/events/catalog';

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
};

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
  };
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6AF6] hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" />
          Etkinlik listesi
        </Link>
      </div>

      <form onSubmit={onSubmit} className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#0E1548] to-[#2D6AF6] px-5 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            {mode === 'edit' ? 'Düzenleme' : 'Yeni kayıt'}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {mode === 'edit' ? 'Etkinliği düzenle' : 'Etkinlik oluştur'}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Program, kontenjan ve yayın durumunu burada yönet.
          </p>
        </div>

        <div className="space-y-6 p-5">
          <section className="space-y-3">
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

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#0E1548]">2 · Tarih ve kontenjan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
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

          <section className="space-y-3">
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
                    onClick={() => {
                      patch('days', form.days.filter((_, i) => i !== index));
                      patch(
                        'activities',
                        form.activities
                          .filter((item) => item.dayIndex !== index)
                          .map((item) => ({
                            ...item,
                            dayIndex: item.dayIndex > index ? item.dayIndex - 1 : item.dayIndex,
                          }))
                      );
                    }}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
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

          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className={labelClass}>Durum</label>
              <select id="status" className={inputClass} value={form.status} onChange={(e) => patch('status', e.target.value as CatalogEventStatus)}>
                {(Object.keys(STATUS_LABELS) as CatalogEventStatus[]).map((key) => (
                  <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                ))}
              </select>
            </div>
            <label className="mt-7 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.assignedToStaff} onChange={(e) => patch('assignedToStaff', e.target.checked)} />
              Görevliye ata (check-in)
            </label>
          </section>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 sm:flex-none">
              {loading ? 'Kaydediliyor…' : mode === 'edit' ? 'Değişiklikleri kaydet' : 'Etkinliği oluştur'}
            </button>
            <Link href="/admin/events" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Vazgeç
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
