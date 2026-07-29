'use client';

import Image from 'next/image';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';

const BRAND_LOGOS = HOME_DEMO_ASSETS.brandLogos;

const SIZE_CLASS = {
  default: 'h-7 w-auto opacity-80 xl:h-8',
  compact: 'h-6 w-auto opacity-90',
  story: 'h-6 max-w-[8.5rem] w-auto object-contain object-left',
} as const;

type BrandLogoProps = {
  name: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

export function BrandLogo({ name, size = 'default', className }: BrandLogoProps) {
  const src = BRAND_LOGOS[name as keyof typeof BRAND_LOGOS];
  const sizeClass = SIZE_CLASS[size];

  if (!src) {
    return (
      <span className={`truncate text-xs font-semibold uppercase tracking-wide text-slate-400 ${className ?? ''}`}>
        {name}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={140}
      height={40}
      className={`${sizeClass} ${className ?? ''}`}
    />
  );
}
