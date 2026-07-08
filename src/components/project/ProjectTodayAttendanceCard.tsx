'use client';

import Link from 'next/link';
import { FiCheckCircle, FiClock, FiUsers } from 'react-icons/fi';
import { TbQrcode } from 'react-icons/tb';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatString } from '@/lib/strings/format';

type Props = {
  projectId: string;
  presentCount: number;
  missingCount: number;
  totalCount: number;
};

export function ProjectTodayAttendanceCard({
  projectId,
  presentCount,
  missingCount,
  totalCount,
}: Props) {
  const strings = useRegistryStrings('components/project/ProjectTodayAttendanceCard');

  const empty = totalCount === 0;
  const allPresent = !empty && missingCount === 0;
  const nonePresent = !empty && presentCount === 0;

  const shell = empty
    ? 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-white'
    : allPresent
      ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white'
      : nonePresent
        ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-white'
        : 'border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-white';

  const iconWrap = empty
    ? 'bg-slate-100 text-slate-500'
    : allPresent
      ? 'bg-emerald-100 text-emerald-600'
      : nonePresent
        ? 'bg-amber-100 text-amber-600'
        : 'bg-sky-100 text-sky-600';

  const badge = empty
    ? 'text-slate-500'
    : allPresent
      ? 'text-emerald-700'
      : nonePresent
        ? 'text-amber-700'
        : 'text-sky-700';

  const Icon = empty ? FiUsers : allPresent ? FiCheckCircle : FiClock;

  const title = empty
    ? strings.emptyTitle
    : allPresent
      ? strings.allPresentTitle
      : nonePresent
        ? strings.pendingTitle
        : strings.confirmedTitle;

  const hint = empty
    ? strings.emptyHint
    : allPresent
      ? formatString(strings.allPresentHint, { present: presentCount })
      : nonePresent
        ? strings.pendingHint
        : formatString(strings.confirmedHint, { present: presentCount, missing: missingCount });

  return (
    <section
      aria-label={strings.sectionAriaLabel}
      className={`overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl ${shell}`}
    >
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconWrap}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
              {strings.badge}
            </p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{hint}</p>
          </div>
        </div>

        {!empty && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {strings.presentLabel}
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700">{presentCount}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {strings.missingLabel}
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-700">{missingCount}</p>
            </div>
          </div>
        )}

        {!empty && (
          <Link
            href={`/admin-panel/proje/${projectId}/yevmiye`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <TbQrcode className="h-4 w-4" aria-hidden />
            {strings.qrCta}
          </Link>
        )}
      </div>
    </section>
  );
}
