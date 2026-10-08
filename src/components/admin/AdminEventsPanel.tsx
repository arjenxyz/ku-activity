'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiMapPin, FiPlus, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { inputClass, labelClass } from '@/components/auth/authStyles';
import { cardClass } from '@/components/ui/styles';
import type { CatalogEvent, CatalogEventStatus } from '@/lib/events/catalog';
import { STATUS_LABELS } from '@/lib/events/catalog';

type AdminEvent = CatalogEvent & { registeredCount?: number };

type DayDraft = { label: string; dateIso: string };
type ActivityDraft = { dayIndex: number; title: string; startsAt: string };

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

export function AdminEventsPanel() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [open, setOpen] = useState(false);
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

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'Oluşturulamadı');
        return;
      }
      setMessage('Etkinlik oluşturuldu ve listede yayınlandı.');
      setForm(emptyForm);
      setOpen(false);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0E1548]">Events</h1>
          <p className="mt-1 text-sm text-slate-600">
            Etkinlik oluştur, programı tanımla, kaydı aç.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setError(null);
            setMessage(null);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0E1548] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
        >
          {open ? <FiX className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
          {open ? 'Kapat' : 'Yeni etkinlik'}
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{message}</p>
      ) : null}

      {open ? (
        <form onSubmit={onSubmit} className={`${cardClass} overflow-hidden`}>
          <div className="bg-gradient-to-r from-[#0E1548] to-[#2D6AF6] px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Yeni etkinlik</p>
            <p className="mt-1 text-lg font-semibold">Öğrenci sitesinde görünecek kaydı hazırla</p>
          </div>

          <div className="space-y-6 p-5">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0E1548]">Temel bilgiler</h2>
              <div>
                <label htmlFor="title" className={labelClass}>Başlık</label>
                <input
                  id="title"
                  required
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => patch('title', e.target.value)}
                  placeholder="Abana 2028"
                />
              </div>
              <div>
                <label htmlFor="description" className={labelClass}>Açıklama</label>
                <textarea
                  id="description"
                  rows={3}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => patch('description', e.target.value)}
                  placeholder="Kısa tanıtım ve öğrencinin bilmesi gerekenler"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className={labelClass}>Konum</label>
                  <input
                    id="location"
                    required
                    className={inputClass}
                    value={form.location}
                    onChange={(e) => patch('location', e.target.value)}
                    placeholder="Abana, Kastamonu"
                  />
                </div>
                <div>
                  <label htmlFor="prefix" className={labelClass}>Kayıt öneki</label>
                  <input
                    id="prefix"
                    className={inputClass}
                    value={form.registrationPrefix}
                    onChange={(e) => patch('registrationPrefix', e.target.value.toUpperCase())}
                    placeholder={prefixHint}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0E1548]">Tarih ve kontenjan</h2>
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
                  <input
                    id="ends"
                    type="datetime-local"
                    required
                    className={inputClass}
                    value={toLocalInput(form.endsAtIso) || form.endsAtIso}
                    onChange={(e) => patch('endsAtIso', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className={labelClass}>Kayıt son tarihi</label>
                  <input
                    id="deadline"
                    type="datetime-local"
                    required
                    className={inputClass}
                    value={toLocalInput(form.registrationDeadlineIso) || form.registrationDeadlineIso}
                    onChange={(e) => patch('registrationDeadlineIso', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className={labelClass}>Kontenjan</label>
                  <input
                    id="capacity"
                    type="number"
                    min={1}
                    required
                    className={inputClass}
                    value={form.capacity}
                    onChange={(e) => patch('capacity', Number(e.target.value))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#0E1548]">Program günleri</h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                  onClick={() =>
                    patch('days', [
                      ...form.days,
                      { label: `Gün ${form.days.length + 1}`, dateIso: form.startsAtIso },
                    ])
                  }
                >
                  <FiPlus className="h-4 w-4" /> Gün ekle
                </button>
              </div>
              <div className="space-y-2">
                {form.days.map((day, index) => (
                  <div key={index} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      className={inputClass}
                      value={day.label}
                      onChange={(e) => {
                        const next = [...form.days];
                        next[index] = { ...day, label: e.target.value };
                        patch('days', next);
                      }}
                      placeholder="Gün 1"
                    />
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={toLocalInput(day.dateIso) || day.dateIso}
                      onChange={(e) => {
                        const next = [...form.days];
                        next[index] = { ...day, dateIso: e.target.value };
                        patch('days', next);
                      }}
                    />
                    <button
                      type="button"
                      disabled={form.days.length === 1}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500 disabled:opacity-40"
                      onClick={() => {
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
                <h2 className="text-sm font-semibold text-[#0E1548]">Aktiviteler</h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2D6AF6]"
                  onClick={() =>
                    patch('activities', [...form.activities, { dayIndex: 0, title: '', startsAt: '' }])
                  }
                >
                  <FiPlus className="h-4 w-4" /> Aktivite ekle
                </button>
              </div>
              <div className="space-y-2">
                {form.activities.map((activity, index) => (
                  <div key={index} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[7rem_1fr_6rem_auto]">
                    <select
                      className={inputClass}
                      value={activity.dayIndex}
                      onChange={(e) => {
                        const next = [...form.activities];
                        next[index] = { ...activity, dayIndex: Number(e.target.value) };
                        patch('activities', next);
                      }}
                    >
                      {form.days.map((day, dayIndex) => (
                        <option key={dayIndex} value={dayIndex}>
                          {day.label || `Gün ${dayIndex + 1}`}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      value={activity.title}
                      onChange={(e) => {
                        const next = [...form.activities];
                        next[index] = { ...activity, title: e.target.value };
                        patch('activities', next);
                      }}
                      placeholder="Aktivite adı"
                    />
                    <input
                      className={inputClass}
                      value={activity.startsAt}
                      onChange={(e) => {
                        const next = [...form.activities];
                        next[index] = { ...activity, startsAt: e.target.value };
                        patch('activities', next);
                      }}
                      placeholder="10:00"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500"
                      onClick={() =>
                        patch(
                          'activities',
                          form.activities.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className={labelClass}>Durum</label>
                <select
                  id="status"
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => patch('status', e.target.value as CatalogEventStatus)}
                >
                  {(Object.keys(STATUS_LABELS) as CatalogEventStatus[]).map((key) => (
                    <option key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <label className="mt-7 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.assignedToStaff}
                  onChange={(e) => patch('assignedToStaff', e.target.checked)}
                />
                Görevliye ata (check-in)
              </label>
            </section>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 sm:w-auto"
            >
              {loading ? 'Kaydediliyor…' : 'Etkinliği oluştur'}
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className={`${cardClass} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[#0E1548]">{event.title}</h2>
                  <span className="rounded-full bg-[#e8f0ff] px-2.5 py-0.5 text-xs font-medium text-[#2D6AF6]">
                    {event.statusLabel}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <FiMapPin className="h-3.5 w-3.5 text-[#2D6AF6]" />
                  {event.location}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <FiCalendar className="h-3.5 w-3.5 text-[#2D6AF6]" />
                  {event.startsAt === event.endsAt ? event.startsAt : `${event.startsAt} – ${event.endsAt}`}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <FiUsers className="h-3.5 w-3.5" />
                  Kontenjan {event.capacity} · Kayıt {event.registeredCount ?? 0} · {event.days.length} gün
                  {event.assignedToStaff ? ' · Görevliye açık' : ''}
                </p>
              </div>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0E1548]"
                value={event.status}
                onChange={(e) => void setStatus(event.id, e.target.value as CatalogEventStatus)}
              >
                {(Object.keys(STATUS_LABELS) as CatalogEventStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
