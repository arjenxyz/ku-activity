import Image from 'next/image';
import {
  ADMIN_APP_ICON,
  APP_ICON,
  APP_NAME,
  STUDENT_APP_ICON,
  type AppIconVariant,
} from '@/lib/brand';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Varsayılan: ana marka. Student/staff/admin için ilgili uygulama ikonu. */
  variant?: 'default' | 'crewledger' | AppIconVariant;
};

const sizeClass = {
  sm: 'w-9 h-9 rounded-[22%]',
  md: 'w-10 h-10 rounded-[22%]',
  lg: 'w-12 h-12 rounded-[24%]',
} as const;

const ICON_BY_VARIANT: Record<string, string> = {
  default: APP_ICON,
  crewledger: APP_ICON,
  student: STUDENT_APP_ICON,
  personnel: STUDENT_APP_ICON,
  staff: ADMIN_APP_ICON,
  admin: ADMIN_APP_ICON,
};

export function BrandMark({ size = 'md', className = '', variant = 'default' }: Props) {
  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 shadow-lg shadow-slate-900/20 ${sizeClass[size]} ${className}`}
    >
      <Image
        src={ICON_BY_VARIANT[variant] ?? APP_ICON}
        alt={APP_NAME}
        fill
        className="object-cover"
        sizes={size === 'lg' ? '48px' : size === 'sm' ? '36px' : '40px'}
        priority={variant !== 'default' && variant !== 'crewledger'}
      />
    </div>
  );
}
