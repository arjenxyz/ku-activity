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
    <div className="space-y-4 pb-6 sm:space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#0E1548] via-[#152060] to-[#2D6AF6] px-4 py-3.5 text-white sm:px-5 sm:py-4">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Ekip ilanı</h1>
                <p className="mt-0.5 max-w-lg text-xs text-white/75">
                  İlanı yönet; başvuruları kabul veya reddet.
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  active
                    ? 'bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40'
                    : 'bg-white/10 text-white/80 ring-1 ring-white/20'
                }`}
              >
                {active ? 'Açık' : 'Kapalı'}
              </span>
            </div>

            {ready ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { label: 'Başvuru', value: String(counts.total) },
                  { label: 'Bekleyen', value: String(counts.pending) },
                  { label: 'Kabul', value: String(counts.accepted) },
                  { label: 'Red', value: String(counts.rejected) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[4.75rem] shrink-0 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-white/65">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!ready ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Yükleniyor…
        </p>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3.5 py-2.5 sm:px-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {active ? 'Aktif ilan' : 'Yeni ilan'}
              </p>
            </div>
            <div className="p-3.5 sm:p-4">
              {active ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold leading-snug text-[#0E1548]">
                    {active.title}
                  </h2>
                  {active.description ? (
                    <p className="text-sm leading-relaxed text-slate-600">{active.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-400">Açılış · {formatWhen(active.createdAt)}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onClose(active.id)}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    İlanı kapat
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Açık ilan yok. Başlık ve açıklama ile yeni çağrı aç — /ekip sayfasında görünür.
                  </p>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Başlık</span>
                    <input
                      required
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2D6AF6]"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Örn. 2026 Gönüllü Ekip"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-500">Açıklama</span>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2D6AF6]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beklenen görevler, uygun günler…"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !title.trim()}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0E1548] text-sm font-semibold text-white disabled:opacity-50"
                  >
                    İlanı aç
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h2 className="text-sm font-semibold text-[#0E1548]">Başvurular</h2>
              {!active ? <span className="text-xs text-slate-400">Önce bir ilan aç</span> : null}
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
                      filter === item.key
                        ? 'bg-[#0E1548] text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`tabular-nums ${
                        filter === item.key ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="space-y-2.5">
              {filteredApps.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  {active ? 'Bu filtrede başvuru yok.' : 'Başvuru listesi boş.'}
                </li>
              ) : (
                filteredApps.map((app) => (
                  <li
                    key={app.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2D6AF6]">
                        <FiUser className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#0E1548]">{app.fullName}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {app.email || '—'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {formatWhen(app.createdAt)}
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
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onReview(app.id, 'accepted')}
                              className="flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Kabul
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onReview(app.id, 'rejected')}
                              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
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

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
