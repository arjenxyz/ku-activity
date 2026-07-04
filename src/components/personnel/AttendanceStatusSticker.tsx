'use client';

import type { IconType } from 'react-icons';
import {
  FiAlertCircle,
  FiCheck,
  FiRefreshCw,
  FiUserMinus,
  FiX,
} from 'react-icons/fi';
import type { PersonnelAttendanceStatusPayload } from '@/lib/personnel-api';

type Variant = {
  accent: string;
  accentSoft: string;
  glow: string;
  pill: string;
  pillDot?: 'pulse' | 'static';
  icon: IconType;
  iconBg: string;
  iconColor: string;
  title: string;
  hint: string;
  primaryAction?: { label: string; onClick: () => void; style: 'ghost' | 'solid' };
};

type Props = {
  status: PersonnelAttendanceStatusPayload;
  forceReplace: boolean;
  onForceReplace: () => void;
};

const SUCCESS_STATES = new Set(['waiting', 'completed']);
const FAILURE_STATES = new Set(['cancelled', 'removed']);

function resolveVariant(
  status: PersonnelAttendanceStatusPayload,
  onForceReplace: () => void
): Variant | null {
  if (status.state === 'waiting') {
    return {
      accent: 'from-emerald-400 to-teal-500',
      accentSoft: 'bg-emerald-50 text-emerald-700',
      glow: 'bg-emerald-400/20',
      pill: 'Yoklamada',
      pillDot: 'pulse',
      icon: FiCheck,
      iconBg: 'bg-emerald-50 ring-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'Listeye eklendiniz',
      hint: 'Usta yoklamayı tamamlayana kadar bekleyin.',
      primaryAction: {
        label: 'Sorun var — yeniden okut',
        onClick: onForceReplace,
        style: 'ghost',
      },
    };
  }

  if (status.state === 'completed') {
    return {
      accent: 'from-teal-400 to-emerald-500',
      accentSoft: 'bg-teal-50 text-teal-700',
      glow: 'bg-teal-400/20',
      pill: 'Tamamlandı',
      pillDot: 'static',
      icon: FiCheck,
      iconBg: 'bg-teal-50 ring-teal-100',
      iconColor: 'text-teal-600',
      title: 'Bugün tamamlandı',
      hint: status.message ?? 'Tam gün kaydınız oluştu.',
      primaryAction: {
        label: 'Sorun var — yeniden okut',
        onClick: onForceReplace,
        style: 'ghost',
      },
    };
  }

  if (status.state === 'cancelled') {
    return {
      accent: 'from-amber-400 to-orange-500',
      accentSoft: 'bg-amber-50 text-amber-800',
      glow: 'bg-amber-400/20',
      pill: 'Yoklama iptal',
      icon: FiAlertCircle,
      iconBg: 'bg-amber-50 ring-amber-100',
      iconColor: 'text-amber-600',
      title: 'Kayıt geçersiz',
      hint: 'Yeni QR okutun — otomatik yeniden kaydedilir.',
      primaryAction: {
        label: 'Yeniden okut',
        onClick: onForceReplace,
        style: 'solid',
      },
    };
  }

  if (status.state === 'removed') {
    return {
      accent: 'from-rose-400 to-red-500',
      accentSoft: 'bg-rose-50 text-rose-700',
      glow: 'bg-rose-400/20',
      pill: 'Listeden çıkarıldınız',
      icon: FiUserMinus,
      iconBg: 'bg-rose-50 ring-rose-100',
      iconColor: 'text-rose-600',
      title: 'Yoklamada değilsiniz',
      hint: 'Yeni QR okutun veya ustanızla görüşün.',
      primaryAction: {
        label: 'Yeniden okut',
        onClick: onForceReplace,
        style: 'solid',
      },
    };
  }

  return null;
}

function StatusPill({
  label,
  className,
  dot = 'static',
}: {
  label: string;
  className: string;
  dot?: 'pulse' | 'static';
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      {dot === 'pulse' ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}

function ResultCard({
  variant,
  onDismiss,
  dismissLabel = 'Kapat',
}: {
  variant: Variant;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const Icon = variant.icon;

  return (
    <div className="attendance-result-pop pointer-events-auto relative w-full max-w-[min(100%,22rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className={`h-1 bg-gradient-to-r ${variant.accent}`} />

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={dismissLabel}
        >
          <FiX className="h-4 w-4" />
        </button>
      )}

      <div className="px-6 pb-6 pt-5 text-center">
        <StatusPill label={variant.pill} className={variant.accentSoft} dot={variant.pillDot} />

        <div className="relative mx-auto mt-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full blur-2xl ${variant.glow}`}
            aria-hidden
          />
          <div
            className={`relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full ring-[10px] ${variant.iconBg}`}
          >
            <Icon className={`h-9 w-9 ${variant.iconColor}`} strokeWidth={2.25} />
          </div>
        </div>

        <h2 className="mt-5 text-[1.35rem] font-bold leading-tight tracking-tight text-slate-900">
          {variant.title}
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-slate-500">
          {variant.hint}
        </p>

        {variant.primaryAction && (
          <button
            type="button"
            onClick={variant.primaryAction.onClick}
            className={
              variant.primaryAction.style === 'solid'
                ? `mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98]`
                : 'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition active:scale-[0.98] hover:bg-slate-50'
            }
          >
            {variant.primaryAction.style === 'solid' && (
              <FiRefreshCw className="h-4 w-4 shrink-0" />
            )}
            {variant.primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultBackdrop({ glowClass }: { glowClass: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[#060d14]/80 backdrop-blur-xl" aria-hidden />
      <div
        className={`pointer-events-none absolute left-1/2 top-[38%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${glowClass}`}
        aria-hidden
      />
    </>
  );
}

export function AttendanceStatusSticker({
  status,
  forceReplace,
  onForceReplace,
}: Props) {
  if (forceReplace || status.state === 'none') return null;

  const isKnown =
    SUCCESS_STATES.has(status.state) || FAILURE_STATES.has(status.state);
  if (!isKnown) return null;

  const variant = resolveVariant(status, onForceReplace);
  if (!variant) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center px-5"
      role="status"
      aria-live="polite"
    >
      <ResultBackdrop glowClass={variant.glow} />
      <ResultCard variant={variant} />
    </div>
  );
}

export function AttendanceScanErrorOverlay({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const variant: Variant = {
    accent: 'from-rose-400 to-red-500',
    accentSoft: 'bg-rose-50 text-rose-700',
    glow: 'bg-rose-400/25',
    pill: 'Okutma başarısız',
    icon: FiAlertCircle,
    iconBg: 'bg-rose-50 ring-rose-100',
    iconColor: 'text-rose-600',
    title: 'QR okunamadı',
    hint: message,
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center px-5">
      <ResultBackdrop glowClass={variant.glow} />
      <ResultCard variant={variant} onDismiss={onDismiss} dismissLabel="Hatayı kapat" />
    </div>
  );
}
