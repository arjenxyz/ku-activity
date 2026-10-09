'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  TEAM_STATUS_LABELS,
  teamStatusTone,
  type TeamApplication,
  type TeamApplicationStatus,
  type TeamCounts,
  type TeamOpening,
} from '@/lib/team/types';

type Snapshot = {
  openings: TeamOpening[];
  activeOpening: TeamOpening | null;
  applications: TeamApplication[];
  counts: TeamCounts;
};

type FilterKey = 'all' | TeamApplicationStatus;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'accepted', label: 'Kabul' },
  { key: 'rejected', label: 'Red' },
];

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminTeamWorkspace() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/team');
    const payload = (await response.json().catch(() => null)) as
      | (Snapshot & { error?: string })
      | null;
    if (!response.ok) {
      setError(payload?.error ?? 'Yüklenemedi');
      setReady(true);
      return;
    }
    setData(payload as Snapshot);
    setError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredApps = useMemo(() => {
    const rows = data?.applications ?? [];
    if (filter === 'all') return rows;
    return rows.filter((row) => row.status === filter);
  }, [data?.applications, filter]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title, description }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Snapshot & { error?: string })
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'İlan açılamadı');
      setData(payload as Snapshot);
      setTitle('');
      setDescription('');
      setMessage('İlan açıldı. /ekip sayfasından başvuru alınabilir.');
      setFilter('all');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function onClose(openingId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', openingId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Snapshot & { error?: string })
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'İlan kapatılamadı');
      setData(payload as Snapshot);
      setMessage('İlan kapatıldı.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function onReview(applicationId: string, status: 'accepted' | 'rejected') {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | (Snapshot & { error?: string })
        | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Güncellenemedi');
      setData(payload as Snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  const counts = data?.counts ?? { total: 0, pending: 0, accepted: 0, rejected: 0 };
  const active = data?.activeOpening ?? null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-[#0E1548]">Ekip ilanı</h1>
        <p className="mt-1 text-sm text-slate-500">
          İlanı yönet; başvuruları kabul veya reddet. Açık ilan /ekip sayfasında görünür.
        </p>
      </header>

      {!ready ? (
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                label: 'Durum',
                value: active ? 'Açık' : 'Kapalı',
                tone: active ? 'text-emerald-700' : 'text-slate-600',
              },
              { label: 'Başvuru', value: String(counts.total), tone: 'text-[#0E1548]' },
              { label: 'Bekleyen', value: String(counts.pending), tone: 'text-amber-700' },
              { label: 'Kabul', value: String(counts.accepted), tone: 'text-emerald-700' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className={`mt-1 text-xl font-semibold tracking-tight ${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              {active ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                        Aktif ilan
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-[#0E1548]">{active.title}</h2>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Açık
                    </span>
                  </div>
                  {active.description ? (
                    <p className="text-sm leading-relaxed text-slate-600">{active.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-400">Açılış · {formatWhen(active.createdAt)}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onClose(active.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    İlanı kapat
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Yeni ilan
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Şu an açık ilan yok. Başlık ve açıklama ile yeni çağrı aç.
                    </p>
                  </div>
                  <label className="block text-sm">
                    <span className="text-xs font-medium text-slate-500">Başlık</span>
                    <input
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn. 2026 Gönüllü Ekip"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs font-medium text-slate-500">Açıklama</span>
                    <textarea
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beklenen görevler, uygun günler…"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !title.trim()}
                    className="w-full rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    İlanı aç
                  </button>
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#0E1548]">Başvurular</h2>
                {!active ? (
                  <span className="text-xs text-slate-400">Önce bir ilan aç</span>
                ) : null}
              </div>

              <div
                className="mt-3 grid grid-cols-4 gap-0.5 rounded-xl bg-slate-100/90 p-1"
                role="tablist"
                aria-label="Başvuru filtresi"
              >
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.key}
                    onClick={() => setFilter(item.key)}
                    className={`rounded-lg px-1 py-2 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                      filter === item.key
                        ? 'bg-white text-[#0E1548] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <li className="py-8 text-center text-sm text-slate-500">
                    {active ? 'Bu filtrede başvuru yok.' : 'Başvuru listesi boş.'}
                  </li>
                ) : (
                  filteredApps.map((app) => (
                    <li key={app.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#0E1548]">{app.fullName}</p>
                          <p className="truncate text-xs text-slate-500">
                            {app.email || '—'} · {formatWhen(app.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${teamStatusTone(app.status)}`}
                        >
                          {TEAM_STATUS_LABELS[app.status]}
                        </span>
                      </div>
                      {app.note ? (
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{app.note}</p>
                      ) : null}
                      {app.status === 'pending' ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onReview(app.id, 'accepted')}
                            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Kabul
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onReview(app.id, 'rejected')}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                          >
                            Reddet
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </>
      )}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
