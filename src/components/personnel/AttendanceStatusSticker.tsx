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
  glow: string;
  pill: string;
  pillDot?: 'pulse' | 'static';
  icon: IconType;
  iconRing: string;
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
      glow: 'bg-emerald-400/25',
      pill: 'Yoklamada',
      pillDot: 'pulse',
      icon: FiCheck,
      iconRing: 'ring-emerald-400/30 bg-emerald-500/15',
      iconColor: 'text-emerald-400',
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
      glow: 'bg-teal-400/25',
      pill: 'Tamamlandı',
      pillDot: 'static',
      icon: FiCheck,
      iconRing: 'ring-teal-400/30 bg-teal-500/15',
      iconColor: 'text-teal-400',
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
      glow: 'bg-amber-400/20',
      pill: 'Yoklama iptal',
      icon: FiAlertCircle,
      iconRing: 'ring-amber-400/30 bg-amber-500/15',
      iconColor: 'text-amber-400',
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
      glow: 'bg-rose-400/20',
      pill: 'Listeden çıkarıldınız',
      icon: FiUserMinus,
      iconRing: 'ring-rose-400/30 bg-rose-500/15',
      iconColor: 'text-rose-400',
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
  dot = 'static',
}: {
  label: string;
  dot?: 'pulse' | 'static';
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
      {dot === 'pulse' ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-white/70" />
      )}
      {label}
    </span>
  );
}

function ResultContent({
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
    <div className="attendance-result-pop pointer-events-auto relative flex w-full max-w-sm flex-col items-center px-6 text-center">
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute -top-2 right-0 flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label={dismissLabel}
        >
          <FiX className="h-5 w-5" />
        </button>
      )}

      <StatusPill label={variant.pill} dot={variant.pillDot} />

      <div className="relative mt-8 flex h-24 w-24 items-center justify-center">
        <div className={`absolute inset-0 rounded-full blur-2xl ${variant.glow}`} aria-hidden />
        <div
          className={`relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full ring-2 ${variant.iconRing}`}
        >
          <Icon className={`h-10 w-10 ${variant.iconColor}`} strokeWidth={2} />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-white">
        {variant.title}
      </h2>
      <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/65">{variant.hint}</p>

      {variant.primaryAction && (
        <button
          type="button"
          onClick={variant.primaryAction.onClick}
          className={
            variant.primaryAction.style === 'solid'
              ? 'mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition active:scale-[0.98]'
              : 'mt-8 text-sm font-medium text-white/75 underline decoration-white/30 underline-offset-4 transition hover:text-white'
          }
        >
          {variant.primaryAction.style === 'solid' && (
            <FiRefreshCw className="h-4 w-4 shrink-0" />
          )}
          {variant.primaryAction.label}
        </button>
      )}
    </div>
  );
}

function ResultBackdrop({ glowClass }: { glowClass: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[#060d14]/88 backdrop-blur-md" aria-hidden />
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${glowClass}`}
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
      className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <ResultBackdrop glowClass={variant.glow} />
      <ResultContent variant={variant} />
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
    glow: 'bg-rose-400/25',
    pill: 'Okutma başarısız',
    icon: FiAlertCircle,
    iconRing: 'ring-rose-400/30 bg-rose-500/15',
    iconColor: 'text-rose-400',
    title: 'QR okunamadı',
    hint: message,
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center">
      <ResultBackdrop glowClass={variant.glow} />
      <ResultContent variant={variant} onDismiss={onDismiss} dismissLabel="Hatayı kapat" />
    </div>
  );
}
