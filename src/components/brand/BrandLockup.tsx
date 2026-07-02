import { BrandMark } from '@/components/brand/BrandMark';

type BrandLockupSize = 'sm' | 'md' | 'lg';

type Props = {
  size?: BrandLockupSize;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
};

const sizeConfig = {
  sm: {
    icon: 'sm' as const,
    wordmark: 'text-[2.25rem] leading-none tracking-[0.05em]',
    gap: 'gap-2.5',
  },
  md: {
    icon: 'md' as const,
    wordmark: 'text-[2.5rem] leading-none tracking-[0.05em]',
    gap: 'gap-3',
  },
  lg: {
    icon: 'lg' as const,
    wordmark: 'text-[3rem] leading-none tracking-[0.05em]',
    gap: 'gap-3',
  },
} as const;

export function BrandLockup({
  size = 'md',
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
  subtitle,
  subtitleClassName = '',
}: Props) {
  const cfg = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className={`flex items-center ${cfg.gap}`}>
        <BrandMark size={cfg.icon} className={iconClassName} />
        <span className={`font-bold text-white ${cfg.wordmark} ${wordmarkClassName}`}>
          CREWLEDGER
        </span>
      </div>
      {subtitle ? (
        <p className={`mt-2 ${subtitleClassName}`}>{subtitle}</p>
      ) : null}
    </div>
  );
}
