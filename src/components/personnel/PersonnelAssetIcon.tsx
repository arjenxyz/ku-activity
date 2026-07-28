'use client';

import { useState } from 'react';

/** Personel menü / dock PNG ikonları (`public/personnel-ui`) — PWA `/icons/*` rotalarından ayrı */

export const PERSONNEL_ICON_SRC = {
  home: '/personnel-ui/home.png',
  work: '/personnel-ui/takvim.png',
  yoklama: '/personnel-ui/qr-code.png',
  finance: '/personnel-ui/docs-check.svg',
  avans: '/personnel-ui/avans.png',
  asgari: '/personnel-ui/security.png',
  rights: '/personnel-ui/agreement.png',
  settings: '/personnel-ui/settings.svg',
  more: '/personnel-ui/menu.png',
  bell: '/personnel-ui/bell.png',
  camera: '/personnel-ui/photo-camera.png',
  clock: '/personnel-ui/clock.png',
  briefcase: '/personnel-ui/is.png',
  updated: '/personnel-ui/updated.png',
  appSettings: '/personnel-ui/app-settings.png',
  docsCheck: '/personnel-ui/docs-check.svg',
  bordroPng: '/personnel-ui/bordro.png',
  avatar: '/personnel-ui/Avatar.svg',
} as const;

export type PersonnelIconName = keyof typeof PERSONNEL_ICON_SRC;

type IconProps = {
  name: PersonnelIconName;
  className?: string;
};

/**
 * PNG ikonlar (siyah zemin flood-fill ile şeffaflaştırıldı).
 * Beyaz badge üzerinde net görünür.
 */
export function PersonnelAssetIcon({ name, className = 'h-8 w-8' }: IconProps) {
  const [failed, setFailed] = useState(false);
  const src = `${PERSONNEL_ICON_SRC[name]}?v=7`;

  if (failed) {
    return (
      <span
        className={`inline-block rounded-lg bg-slate-200/80 dark:bg-slate-700/80 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`object-contain ${className}`}
      width={64}
      height={64}
      draggable={false}
      aria-hidden
      onError={() => setFailed(true)}
    />
  );
}

type BadgeProps = {
  name: PersonnelIconName;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
};

const BADGE_BOX = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-2xl',
  lg: 'h-12 w-12 rounded-2xl',
} as const;

const BADGE_IMG = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
} as const;

/** Docs check SVG'de fazla boşluk var — dock/menüde büyüt. */
const LARGE_FILL_ICONS = new Set<PersonnelIconName>(['finance', 'docsCheck']);

export function PersonnelIconBadge({
  name,
  size = 'sm',
  active = false,
  className = '',
}: BadgeProps) {
  const fillLarge = LARGE_FILL_ICONS.has(name);
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/90 ${BADGE_BOX[size]} ${
        active ? 'ring-2 ring-[#0E1548]/35' : ''
      } ${className}`}
    >
      <PersonnelAssetIcon
        name={name}
        className={`${BADGE_IMG[size]} ${fillLarge ? 'scale-[1.55]' : ''}`}
      />
    </span>
  );
}
