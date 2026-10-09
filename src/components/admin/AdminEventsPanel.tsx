'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import type { CatalogEvent, CatalogEventStatus } from '@/lib/events/catalog';
import { STATUS_LABELS } from '@/lib/events/catalog';

type AdminEvent = CatalogEvent & { registeredCount?: number };
type DayDraft = { label: string; dateIso: string };
type ActivityDraft = { dayIndex: number; title: string; startsAt: string };
type FilterKey = 'all' | 'registration_open' | 'published' | 'other';

const emptyForm = {
  title: '',
  description: '',
  location: '',
  startsAtIso: '',
  endsAtIso: '',
  capacity: 100,
  status: 'registration_open' as CatalogEventStatus,
  registrationDeadlineIso: '',
  assignedToStaff: true,
  registrationPrefix: '',
  days: [{ label: 'Gün 1', dateIso: '' }] as DayDraft[],
  activities: [{ dayIndex: 0, title: '', startsAt: '' }] as ActivityDraft[],
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

function statusTone(status: CatalogEventStatus | string) {
  if (status === 'registration_open') return 'bg-emerald-50 text-emerald-800 ring-emerald-100';
  if (status === 'published') return 'bg-[#e8f0ff] text-[#2D6AF6] ring-[#d6e4ff]';
  if (status === 'registration_closed') return 'bg-amber-50 text-amber-800 ring-amber-100';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

function bandFor(id: string) {
  if (id.includes('abana')) return 'from-[#0E1548] via-[#1a3a7a] to-[#2D6AF6]';
  if (id.includes('tanisma')) return 'from-[#0E1548] via-[#152060] to-[#3d5a9e]';
  return 'from-[#0E1548] to-[#2D6AF6]';
}

function eventToForm(event: AdminEvent) {
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

export function AdminEventsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/events');
    const payload = (await response.json().catch(() => null)) as { events?: AdminEvent[] } | null;
    setEvents(payload?.events ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

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

  const stats = useMemo(() => {
    const openCount = events.filter((e) => e.status === 'registration_open').length;
    const published = events.filter((e) => e.status === 'published').length;
    const regs = events.reduce((sum, e) => sum + (e.registeredCount ?? 0), 0);
    const staff = events.filter((e) => e.assignedToStaff).length;
    return [
      { label: 'Toplam', value: events.length },
      { label: 'Kayıt açık', value: openCount },
      { label: 'Yayında', value: published },
      { label: 'Kayıt / görevli', value: `${regs} / ${staff}` },
    ];
  }, [events]);

  const filtered = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'other') {
      return event.status !== 'registration_open' && event.status !== 'published';
    }
    return event.status === filter;
  });

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setMessage(null);
    setOpen(true);
  }

  function startEdit(event: AdminEvent) {
    setEditingId(event.id);
    setForm(eventToForm(event));
    setError(null);
    setMessage(null);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payloadBody = {
        ...(editingId ? { id: editingId } : {}),
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
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? (editingId ? 'Güncellenemedi' : 'Oluşturulamadı'));
        return;
      }
      setMessage(editingId ? 'Etkinlik güncellendi.' : 'Etkinlik oluşturuldu.');
      closeForm();
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: CatalogEventStatus) {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
        <div className={`relative bg-gradient-to-br ${bandFor('admin')} px-5 py-6 text-white`}>
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Yönetim</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Etkinlikler</h1>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Programı kur, kaydı aç, öğrenci sitesinde yayınla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (open) closeForm();
                else startCreate();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              {open ? <FiX className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
              {open ? 'Formu kapat' : 'Yeni etkinlik'}
            </button>
          </div>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-[#0E1548]">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {message ? (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <FiCheckCircle className="h-4 w-4" />
          {message}
        </p>
      ) : null}

      {open ? (
        <form onSubmit={onSubmit} className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">
              {editingId ? 'Düzenleme' : 'Yeni kayıt'}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#0E1548]">
              {editingId ? 'Etkinliği düzenle' : 'Etkinlik oluştur'}
            </h2>
          </div>

          <div className="space-y-6 p-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0E1548]">1 · Temel bilgiler</h3>
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
              <h3 className="text-sm font-semibold text-[#0E1548]">2 · Tarih ve kontenjan</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="starts" className={labelClass}>Başlangıç</label>
                  <input
                    id="starts"
                    type="datetime-local"
                    required
                    className={inputClass}
                    value={toLocalInput(form.startsAtIso) || form.startsAtIso}
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
                  <input id="ends" type="datetime-local" required className={inputClass} value={toLocalInput(form.endsAtIso) || form.endsAtIso} onChange={(e) => patch('endsAtIso', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="deadline" className={labelClass}>Kayıt son tarihi</label>
                  <input id="deadline" type="datetime-local" required className={inputClass} value={toLocalInput(form.registrationDeadlineIso) || form.registrationDeadlineIso} onChange={(e) => patch('registrationDeadlineIso', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="capacity" className={labelClass}>Kontenjan</label>
                  <input id="capacity" type="number" min={1} required className={inputClass} value={form.capacity} onChange={(e) => patch('capacity', Number(e.target.value))} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#0E1548]">3 · Program günleri</h3>
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
                    <input type="datetime-local" className={inputClass} value={toLocalInput(day.dateIso) || day.dateIso} onChange={(e) => { const next = [...form.days]; next[index] = { ...day, dateIso: e.target.value }; patch('days', next); }} />
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
                <h3 className="text-sm font-semibold text-[#0E1548]">4 · Aktiviteler</h3>
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

            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 sm:w-auto">
              {loading ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Etkinliği oluştur'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'Tümü' },
            { key: 'registration_open', label: 'Kayıt açık' },
            { key: 'published', label: 'Yayında' },
            { key: 'other', label: 'Diğer' },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === item.key
                ? 'bg-[#0E1548] text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-4">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center text-sm text-slate-500">
            Bu filtrede etkinlik yok.
          </li>
        ) : null}
        {filtered.map((event) => {
          const taken = event.registeredCount ?? 0;
          const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
          const dateLabel =
            event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`;
          return (
            <li key={event.id} className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
              <div className={`relative h-20 bg-gradient-to-br ${bandFor(event.id)}`}>
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:12px_12px]" />
                <div className="relative flex h-full items-start justify-between p-4">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
                    {event.days.length > 1 ? `${event.days.length} gün` : 'Tek gün'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(event.status)}`}>
                    {event.statusLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#0E1548]">{event.title}</h2>
                  {event.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{event.description}</p>
                  ) : null}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-[#2D6AF6]" />
                    {event.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-[#2D6AF6]" />
                    {dateLabel}
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FiUsers className="h-3.5 w-3.5" />
                      {taken}/{event.capacity} kayıt
                    </span>
                    {event.assignedToStaff ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <FiUserCheck className="h-3.5 w-3.5" />
                        Görevliye açık
                      </span>
                    ) : null}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#2D6AF6]" style={{ width: `${Math.max(fill, taken > 0 ? 6 : 0)}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                  <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
                    Durum
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0E1548]"
                      value={event.status}
                      onChange={(e) => void setStatus(event.id, e.target.value as CatalogEventStatus)}
                    >
                      {(Object.keys(STATUS_LABELS) as CatalogEventStatus[]).map((key) => (
                        <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                      ))}
                    </select>
                  </label>
                  <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    Önek <span className="font-semibold text-[#0E1548]">{event.registrationPrefix}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => startEdit(event)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0E1548] transition hover:bg-[#e8f0ff]"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    Düzenle
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
