'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FiUser } from 'react-icons/fi';
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
    <div className="space-y-3 pb-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-[#0E1548]">Ekip ilanı</h1>
          <p className="mt-0.5 text-xs text-slate-500">İlan ve başvuruları yönet.</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
            active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {active ? 'Açık' : 'Kapalı'}
        </span>
      </header>

      {ready ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          {[
            { label: 'Başvuru', value: counts.total },
            { label: 'Bekleyen', value: counts.pending },
            { label: 'Kabul', value: counts.accepted },
            { label: 'Red', value: counts.rejected },
          ].map((item) => (
            <span key={item.label} className="inline-flex items-baseline gap-1">
              <span className="text-slate-400">{item.label}</span>
              <span className="font-semibold tabular-nums text-[#0E1548]">{item.value}</span>
            </span>
          ))}
        </div>
      ) : null}

      {!ready ? (
        <p className="py-6 text-center text-sm text-slate-500">Yükleniyor…</p>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            {active ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Aktif ilan
                    </p>
                    <h2 className="mt-0.5 text-sm font-semibold text-[#0E1548]">{active.title}</h2>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onClose(active.id)}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Kapat
                  </button>
                </div>
                {active.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {active.description}
                  </p>
                ) : null}
                <p className="text-[11px] text-slate-400">Açılış · {formatWhen(active.createdAt)}</p>
              </div>
            ) : (
              <form onSubmit={(e) => void onCreate(e)} className="space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Yeni ilan
                </p>
                <p className="text-xs text-slate-500">
                  Açık ilan yok. /ekip sayfasında görünecek çağrıyı aç.
                </p>
                <input
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Başlık"
                />
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#2D6AF6]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Açıklama"
                />
                <button
                  type="submit"
                  disabled={busy || !title.trim()}
                  className="h-9 w-full rounded-lg bg-[#0E1548] text-xs font-semibold text-white disabled:opacity-50"
                >
                  İlanı aç
                </button>
              </form>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0E1548]">Başvurular</h2>
              {!active ? <span className="text-[11px] text-slate-400">Önce ilan aç</span> : null}
            </div>

            <div
              className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Başvuru filtresi"
            >
              {FILTERS.map((item) => {
                const count =
                  item.key === 'all'
                    ? counts.total
                    : item.key === 'pending'
                      ? counts.pending
                      : item.key === 'accepted'
                        ? counts.accepted
                        : counts.rejected;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.key}
                    onClick={() => setFilter(item.key)}
                    className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold transition ${
                      filter === item.key
                        ? 'bg-[#0E1548] text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {item.label}
                    <span className={filter === item.key ? 'text-white/70' : 'text-slate-400'}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {filteredApps.length === 0 ? (
                <li className="px-3 py-6 text-center text-xs text-slate-500">
                  {active ? 'Bu filtrede başvuru yok.' : 'Başvuru yok.'}
                </li>
              ) : (
                filteredApps.map((app) => (
                  <li key={app.id} className="px-3 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <FiUser className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#0E1548]">
                              {app.fullName}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              {app.email || '—'} · {formatWhen(app.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${teamStatusTone(app.status)}`}
                          >
                            {TEAM_STATUS_LABELS[app.status]}
                          </span>
                        </div>
                        {app.note ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{app.note}</p>
                        ) : null}
                        {app.status === 'pending' ? (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onReview(app.id, 'accepted')}
                              className="h-8 flex-1 rounded-lg bg-emerald-600 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                              Kabul
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onReview(app.id, 'rejected')}
                              className="h-8 flex-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
