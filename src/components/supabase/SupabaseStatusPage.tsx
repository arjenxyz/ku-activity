import { formatDateTime } from '@/lib/format';
import type { KeepaliveStatus } from '@/lib/supabase-keepalive';

type Props = {
  status: KeepaliveStatus;
};

export function SupabaseStatusPage({ status }: Props) {
  const isOk = status.overall === 'ok';

  const title = isOk
    ? 'Başarılı — devam ediyor'
    : status.overall === 'critical'
      ? 'Sorun var'
      : status.overall === 'warning'
        ? 'Ping gecikmiş'
        : 'Henüz bilinmiyor';

  const iconClass = isOk
    ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
    : status.overall === 'unknown'
      ? 'bg-slate-700/40 text-slate-400 ring-slate-600/30'
      : 'bg-amber-500/15 text-amber-400 ring-amber-500/30';

  const titleClass = isOk
    ? 'text-emerald-400'
    : status.overall === 'unknown'
      ? 'text-slate-400'
      : 'text-amber-400';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ring-1 ${iconClass}`}
          aria-hidden
        >
          {isOk ? '✓' : status.overall === 'unknown' ? '·' : '!'}
        </div>
        <h1 className={`mt-5 text-xl font-semibold sm:text-2xl ${titleClass}`}>{title}</h1>
        {isOk && status.lastSuccess ? (
          <p className="mt-2 text-sm text-slate-500">
            Son ping: {formatDateTime(status.lastSuccess.createdAt)}
          </p>
        ) : !isOk ? (
          <p className="mt-2 max-w-xs text-sm text-slate-500">{status.detail}</p>
        ) : null}
      </div>
    </div>
  );
}
