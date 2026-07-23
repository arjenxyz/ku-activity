'use client';

import { useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<Size, string> = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl',
};

export const DEFAULT_AVATAR_SRC = '/icons/Avatar.svg';

export function EmployeeAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
}: {
  name: string;
  photoUrl?: string | null;
  size?: Size;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const base = `rounded-full object-cover shrink-0 ${sizeClass[size]} ${className}`;
  const showPhoto = Boolean(photoUrl) && !broken;
  const src = showPhoto ? photoUrl! : DEFAULT_AVATAR_SRC;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`${base} bg-slate-100`}
      onError={() => {
        if (showPhoto) setBroken(true);
      }}
    />
  );
}
