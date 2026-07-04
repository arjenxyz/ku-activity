'use client';

import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import type { PersonnelAttendanceStatusPayload } from '@/lib/personnel-api';

type Props = {
  status: PersonnelAttendanceStatusPayload;
  forceReplace: boolean;
  onForceReplace: () => void;
};

const SUCCESS_STATES = new Set(['waiting', 'completed']);
const FAILURE_STATES = new Set(['cancelled', 'removed']);

export function AttendanceStatusSticker({
  status,
  forceReplace,
  onForceReplace,
}: Props) {
  if (forceReplace || status.state === 'none') return null;

  const isSuccess = SUCCESS_STATES.has(status.state);
  const isFailure = FAILURE_STATES.has(status.state);
  if (!isSuccess && !isFailure) return null;

  const showRescanToggle = isSuccess;

  const content = isSuccess
    ? status.state === 'completed'
      ? {
          icon: FiCheckCircle,
          stamp: 'Tamamlandı',
          title: 'Bugün tamamlandı',
          hint: status.message ?? 'Tam gün kaydınız oluştu.',
          ring: 'border-emerald-400/70',
          bg: 'bg-emerald-950/90',
          iconColor: 'text-emerald-400',
          titleColor: 'text-emerald-50',
          hintColor: 'text-emerald-200/85',
          stampColor: 'text-emerald-300/90',
        }
      : {
          icon: FiClock,
          stamp: 'Okutuldu',
          title: 'Listeye eklendiniz',
          hint: 'Usta yoklamayı tamamlayana kadar bekleyin.',
          ring: 'border-emerald-400/70',
          bg: 'bg-emerald-950/90',
          iconColor: 'text-emerald-400',
          titleColor: 'text-emerald-50',
          hintColor: 'text-emerald-200/85',
          stampColor: 'text-emerald-300/90',
        }
    : status.state === 'removed'
      ? {
          icon: FiXCircle,
          stamp: 'Çıkarıldı',
          title: 'Listeden çıkarıldınız',
          hint: 'Yeni QR okutun veya ustanızla görüşün.',
          ring: 'border-red-400/70',
          bg: 'bg-red-950/90',
          iconColor: 'text-red-400',
          titleColor: 'text-red-50',
          hintColor: 'text-red-200/85',
          stampColor: 'text-red-300/90',
        }
      : {
          icon: FiAlertTriangle,
          stamp: 'İptal',
          title: 'Yoklama iptal',
          hint: 'Yeni QR okutun — otomatik yeniden kaydedilir.',
          ring: 'border-amber-400/70',
          bg: 'bg-amber-950/90',
          iconColor: 'text-amber-400',
          titleColor: 'text-amber-50',
          hintColor: 'text-amber-200/85',
          stampColor: 'text-amber-300/90',
        };

  const Icon = content.icon;

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center px-6">
      <div
        className={`pointer-events-auto relative w-full max-w-[280px] -rotate-2 rounded-2xl border-[3px] px-6 py-7 text-center shadow-2xl backdrop-blur-md ${content.ring} ${content.bg}`}
        role="status"
        aria-live="polite"
      >
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.35em] ${content.stampColor}`}
        >
          {content.stamp}
        </p>

        <Icon className={`mx-auto mt-4 h-16 w-16 ${content.iconColor}`} strokeWidth={1.5} />

        <p className={`mt-4 text-lg font-bold leading-tight ${content.titleColor}`}>
          {content.title}
        </p>
        <p className={`mt-2 text-sm leading-snug ${content.hintColor}`}>{content.hint}</p>

        {showRescanToggle && (
          <button
            type="button"
            onClick={onForceReplace}
            className="mt-5 text-xs font-semibold underline opacity-90 transition hover:opacity-100"
          >
            Sorun var — yeniden okut
          </button>
        )}

        {isFailure && (
          <button
            type="button"
            onClick={onForceReplace}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition active:bg-white/20"
          >
            Yeniden okut
          </button>
        )}
      </div>
    </div>
  );
}
