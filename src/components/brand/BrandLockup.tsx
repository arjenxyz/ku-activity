import { BrandMark } from '@/components/brand/BrandMark';

type BrandLockupSize = 'sm' | 'md' | 'lg';
type BrandLockupLayout = 'inline' | 'stacked';

type Props = {
  size?: BrandLockupSize;
  layout?: BrandLockupLayout;
  align?: 'start' | 'center';
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
};

/** Yazı yüksekliği ikon kutusuyla hizalı; abartılı büyük font yok */
const sizeConfig = {
  sm: {
    icon: 'sm' as const,
    wordmark: 'h-9 text-xs tracking-[0.1em]',
    gap: 'gap-2',
    stackedGap: 'mt-2',
  },
  md: {
    icon: 'md' as const,
    wordmark: 'h-10 text-sm tracking-[0.08em]',
    gap: 'gap-2.5',
    stackedGap: 'mt-2',
  },
  lg: {
    icon: 'lg' as const,
    wordmark: 'h-12 text-sm sm:text-[15px] tracking-[0.08em]',
    gap: 'gap-2.5',
    stackedGap: 'mt-2',
  },
} as const;

export function BrandLockup({
  size = 'md',
  layout = 'inline',
  align = 'center',
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
  subtitle,
  subtitleClassName = '',
}: Props) {
  const cfg = sizeConfig[size];
  const alignClass = align === 'start' ? 'items-start text-left' : 'items-center text-center';
  const wordmarkEl = (
    <span
      className={`inline-flex items-center font-semibold text-white whitespace-nowrap ${cfg.wordmark} ${wordmarkClassName}`}
    >
      CREWLEDGER
    </span>
  );

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col ${alignClass} ${className}`}>
        <BrandMark size={cfg.icon} className={iconClassName} />
        <div className={cfg.stackedGap}>{wordmarkEl}</div>
        {subtitle ? (
          <p className={`mt-1 ${subtitleClassName}`}>{subtitle}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <div className={`flex items-center flex-nowrap ${cfg.gap}`}>
        <BrandMark size={cfg.icon} className={iconClassName} />
        {wordmarkEl}
      </div>
      {subtitle ? (
        <p className={`mt-1.5 ${subtitleClassName}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
