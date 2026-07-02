import Image from 'next/image';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClass = {
  sm: 'w-9 h-9 rounded-[22%]',
  md: 'w-10 h-10 rounded-[22%]',
  lg: 'w-12 h-12 rounded-[24%]',
} as const;

export function BrandMark({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 shadow-lg shadow-slate-900/20 ${sizeClass[size]} ${className}`}
    >
      <Image
        src={CREWLEDGER_APP_ICON}
        alt="CrewLedger"
        fill
        className="object-cover"
        sizes={size === 'lg' ? '48px' : size === 'sm' ? '36px' : '40px'}
      />
    </div>
  );
}
