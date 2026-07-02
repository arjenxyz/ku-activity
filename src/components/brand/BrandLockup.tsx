import { BrandMark } from '@/components/brand/BrandMark';

type BrandLockupSize = 'sm' | 'md' | 'lg';
type BrandLockupLayout = 'inline' | 'stacked';

type Props = {
  size?: BrandLockupSize;
  layout?: BrandLockupLayout;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
};

const sizeConfig = {
  sm: {
    icon: 'sm' as const,
    inlineWordmark: 'text-[1.35rem] sm:text-[2.25rem] leading-none tracking-[0.04em]',
    stackedWordmark: 'text-[1.35rem] leading-none tracking-[0.1em]',
    gap: 'gap-2',
  },
  md: {
    icon: 'md' as const,
    inlineWordmark: 'text-[1.5rem] sm:text-[2.5rem] leading-none tracking-[0.04em]',
    stackedWordmark: 'text-[1.5rem] leading-none tracking-[0.1em]',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'lg' as const,
    inlineWordmark: 'text-[1.65rem] sm:text-[3rem] leading-none tracking-[0.04em]',
    stackedWordmark: 'text-[2rem] leading-none tracking-[0.1em]',
    gap: 'gap-2.5',
  },
} as const;

export function BrandLockup({
  size = 'md',
  layout = 'inline',
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
  subtitle,
  subtitleClassName = '',
}: Props) {
  const cfg = sizeConfig[size];
  const wordmarkClass =
    layout === 'stacked' ? cfg.stackedWordmark : cfg.inlineWordmark;

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <BrandMark size={cfg.icon} className={iconClassName} />
        <span
          className={`mt-2.5 font-bold text-white whitespace-nowrap ${wordmarkClass} ${wordmarkClassName}`}
        >
          CREWLEDGER
        </span>
        {subtitle ? (
          <p className={`mt-1.5 ${subtitleClassName}`}>{subtitle}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className={`flex items-center flex-nowrap ${cfg.gap}`}>
        <BrandMark size={cfg.icon} className={iconClassName} />
        <span
          className={`font-bold text-white whitespace-nowrap ${wordmarkClass} ${wordmarkClassName}`}
        >
          CREWLEDGER
        </span>
      </div>
      {subtitle ? (
        <p className={`mt-2 ${subtitleClassName}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
