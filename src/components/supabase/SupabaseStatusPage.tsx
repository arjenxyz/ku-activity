'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { KeepaliveStatus } from '@/lib/supabase-keepalive';
import { formatDateTime } from '@/lib/format';

type Props = {
  initial: KeepaliveStatus & { checkedAt: string };
};

const overallStyles: Record<
  KeepaliveStatus['overall'],
  { ring: string; badge: string; glow: string; icon: string }
> = {
  ok: {
    ring: 'border-emerald-500/40',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    glow: 'from-emerald-500/20 to-teal-500/10',
    icon: '✓',
  },
  warning: {
    ring: 'border-amber-500/40',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
    glow: 'from-amber-500/20 to-orange-500/10',
    icon: '!',
  },
  critical: {
    ring: 'border-rose-500/40',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    glow: 'from-rose-500/20 to-red-500/10',
    icon: '✕',
  },
  unknown: {
    ring: 'border-slate-400/40',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    glow: 'from-slate-500/15 to-slate-600/10',
    icon: '?',
  },
};

export function SupabaseStatusPage({ initial }: Props) {
  const [status, setStatus] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/public/supabase-status', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as KeepaliveStatus & { checkedAt: string };
        setStatus(data);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const style = overallStyles[status.overall];
  const lastOk = status.lastSuccess;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
              CrewLedger · Altyapı
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Supabase Durumu
            </h1>
            <p className="mt-2 max-w-xl text-slate-400">
              cron-job.org üzerinden gelen keepalive istekleri gerçek bir veritabanı sorgusu
              çalıştırır; sonuçlar burada kayıt altına alınır.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Ana sayfa
          </Link>
        </header>

        <section
          className={`relative overflow-hidden rounded-3xl border ${style.ring} bg-gradient-to-br ${style.glow} bg-slate-900/80 p-6 sm:p-8 backdrop-blur`}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-xs">
                  {style.icon}
                </span>
                {status.overall === 'ok'
                  ? 'Everything OK'
                  : status.overall === 'warning'
                    ? 'Dikkat'
                    : status.overall === 'critical'
                      ? 'Sorun var'
                      : 'Bilinmiyor'}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                {status.headline}
              </h2>
              <p className="mt-2 text-slate-300">{status.detail}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              {refreshing ? 'Yenileniyor…' : 'Yenile'}
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Son başarılı ping"
              value={lastOk ? formatDateTime(lastOk.createdAt) : '—'}
              sub={
                lastOk
                  ? `${lastOk.durationMs} ms · ${lastOk.projectCount ?? '?'} proje sayıldı`
                  : 'Henüz kayıt yok'
              }
              verified={Boolean(lastOk)}
            />
            <StatCard
              label="Kaynak"
              value={lastOk?.source ?? status.lastRun?.source ?? '—'}
              sub="User-Agent’tan tespit"
              verified={Boolean(lastOk?.source)}
            />
            <StatCard
              label="Duraklama riski"
              value={
                status.pauseRiskDaysLeft != null
                  ? `~${status.pauseRiskDaysLeft} gün`
                  : '—'
              }
              sub="7 günlük hareketsizlik eşiği"
              verified={status.overall === 'ok'}
            />
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">Gerçek mi, sahte mi?</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="text-emerald-400">●</span>
              <span>
                Her cron çağrısında <strong className="text-white">projects</strong> tablosunda{' '}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300">COUNT</code>{' '}
                sorgusu çalışır; süre ve proje sayısı kaydedilir.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400">●</span>
              <span>
                Bu sayfa veritabanındaki{' '}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300">
                  supabase_keepalive_runs
                </code>{' '}
                tablosundan okur — statik bir “yeşil ışık” değildir.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400">●</span>
              <span>
                Tablo boşsa veya son ping 12+ saat önceyse cron-job.org job’unu ve{' '}
                <code className="rounded bg-slate-800 px-1.5 py-0.5">CRON_SECRET</code> header’ını
                kontrol edin.
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="font-semibold text-white">Son istekler</h3>
            <p className="text-xs text-slate-500">En fazla 20 kayıt · otomatik yenileme 60 sn</p>
          </div>
          {status.recentRuns.length === 0 ? (
            <p className="px-5 py-10 text-center text-slate-500">
              Henüz keepalive kaydı yok. İlk cron çalıştığında burada görünecek.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Zaman</th>
                    <th className="px-5 py-3">Sonuç</th>
                    <th className="px-5 py-3">Süre</th>
                    <th className="px-5 py-3">Proje</th>
                    <th className="px-5 py-3">Kaynak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {status.recentRuns.map((run) => (
                    <tr key={run.id} className="text-slate-300">
                      <td className="whitespace-nowrap px-5 py-3">
                        {formatDateTime(run.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {run.ok ? (
                          <span className="text-emerald-400">Başarılı</span>
                        ) : (
                          <span className="text-rose-400" title={run.errorMessage ?? undefined}>
                            Hata
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">{run.durationMs} ms</td>
                      <td className="px-5 py-3">{run.projectCount ?? '—'}</td>
                      <td className="px-5 py-3">{run.source ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Son kontrol: {formatDateTime(status.checkedAt)}
          {!status.tableReady && ' · Migration gerekli'}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  verified,
}: {
  label: string;
  value: string;
  sub: string;
  verified: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
        {verified && <span className="text-emerald-500">●</span>}
        {sub}
      </p>
    </div>
  );
}
