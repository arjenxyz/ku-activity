'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CatalogEvent } from '@/lib/events/catalog';
import { emptyPlanning } from '@/lib/events/catalog';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';

export function RegisterForm({ event }: { event: CatalogEvent }) {
  const router = useRouter();
  const planning = event.planning ?? emptyPlanning();
  const transportProvided = planning.transport.provided;
  const hasMeals = planning.meals.length > 0;

  const [dayIds, setDayIds] = useState<string[]>(event.days.map((day) => day.id));
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [transport, setTransport] = useState(transportProvided ? 'otobus' : 'kendi');
  const [meal, setMeal] = useState(hasMeals ? 'standart' : 'yok');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(list: string[], id: string, on: boolean) {
    return on ? [...new Set([...list, id])] : list.filter((item) => item !== id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          dayIds,
          activityIds,
          logistics: {
            transport,
            meal: hasMeals ? meal : 'yok',
            note,
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        registration?: { id: string };
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'Kayıt başarısız');
        return;
      }
      router.push(`/kayitlarim?highlight=${payload?.registration?.id ?? ''}`);
      router.refresh();
    } catch {
      setError('Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/70 p-5">
      <h2 className="text-lg font-semibold text-[#0E1548]">Kayıt ol</h2>
      <div>
        <p className={labelClass}>Günler</p>
        <div className="mt-2 space-y-2">
          {event.days.map((day) => (
            <label key={day.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={dayIds.includes(day.id)}
                onChange={(e) => setDayIds((prev) => toggle(prev, day.id, e.target.checked))}
              />
              {day.label} · {day.date}
            </label>
          ))}
        </div>
      </div>
      {event.activities.length ? (
        <div>
          <p className={labelClass}>Aktiviteler (isteğe bağlı)</p>
          <div className="mt-2 space-y-2">
            {event.activities.map((activity) => (
              <label key={activity.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={activityIds.includes(activity.id)}
                  onChange={(e) => setActivityIds((prev) => toggle(prev, activity.id, e.target.checked))}
                />
                {activity.title}
                {activity.startsAt ? ` · ${activity.startsAt}` : ''}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <label htmlFor="transport" className={labelClass}>Ulaşım</label>
        <select id="transport" className={inputClass} value={transport} onChange={(e) => setTransport(e.target.value)}>
          {transportProvided ? (
            <>
              <option value="otobus">
                {planning.transport.mode || 'Organizasyon ulaşımı'} (katılmak istiyorum)
              </option>
              <option value="kendi">Kendi aracım</option>
              <option value="yok">Ulaşım istemiyorum</option>
            </>
          ) : (
            <>
              <option value="kendi">Kendi aracım</option>
              <option value="yok">Ulaşım istemiyorum</option>
            </>
          )}
        </select>
      </div>
      {hasMeals ? (
        <div>
          <label htmlFor="meal" className={labelClass}>Yemek tercihi</label>
          <select id="meal" className={inputClass} value={meal} onChange={(e) => setMeal(e.target.value)}>
            <option value="standart">Standart</option>
            <option value="vejetaryen">Vejetaryen</option>
            <option value="yok">Yemek istemiyorum</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Detaylı menü ve kim karşılıyor bilgisi yukarıdaki yemek planında.
          </p>
        </div>
      ) : null}
      <div>
        <label htmlFor="note" className={labelClass}>Not</label>
        <textarea id="note" className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={loading} className={primaryButtonClass}>
        {loading ? 'Kaydediliyor…' : 'Kaydı tamamla'}
      </button>
    </form>
  );
}
