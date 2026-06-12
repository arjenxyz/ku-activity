'use client';

import { useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<Size, string> = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl',
};

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
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const base = `rounded-full object-cover shrink-0 ${sizeClass[size]} ${className}`;
  const showImage = photoUrl && !broken;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${base} bg-slate-100`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`${base} bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold flex items-center justify-center`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
