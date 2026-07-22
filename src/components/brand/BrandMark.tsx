import Image from 'next/image';
import {
  ADMIN_APP_ICON,
  CREWLEDGER_APP_ICON,
  PERSONNEL_APP_ICON,
  type AppIconVariant,
} from '@/lib/brand';
import strings from '@json/src/components/brand/BrandMark.json';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Varsayılan: ana marka. Personel/yönetici auth için ilgili uygulama ikonu. */
  variant?: 'crewledger' | AppIconVariant;
};

const sizeClass = {
  sm: 'w-9 h-9 rounded-[22%]',
  md: 'w-10 h-10 rounded-[22%]',
  lg: 'w-12 h-12 rounded-[24%]',
} as const;

const ICON_BY_VARIANT = {
  crewledger: CREWLEDGER_APP_ICON,
  personnel: PERSONNEL_APP_ICON,
  admin: ADMIN_APP_ICON,
} as const;

export function BrandMark({ size = 'md', className = '', variant = 'crewledger' }: Props) {
  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 shadow-lg shadow-slate-900/20 ${sizeClass[size]} ${className}`}
    >
      <Image
        src={ICON_BY_VARIANT[variant]}
        alt={strings.alt}
        fill
        className="object-cover"
        sizes={size === 'lg' ? '48px' : size === 'sm' ? '36px' : '40px'}
        priority={variant !== 'crewledger'}
      />
    </div>
  );
}
