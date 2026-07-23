/** Personel menü / dock PNG ikonları (`public/icons`) */

export const PERSONNEL_ICON_SRC = {
  home: '/icons/home.png',
  work: '/icons/takvim.png',
  yoklama: '/icons/qr.png',
  finance: '/icons/docs-check.svg',
  avans: '/icons/avans.png',
  asgari: '/icons/security.png',
  rights: '/icons/agreement.png',
  settings: '/icons/settings.png',
  more: '/icons/menu.png',
  bell: '/icons/bell.png',
  camera: '/icons/photo-camera.png',
  clock: '/icons/clock.png',
  briefcase: '/icons/is.png',
  updated: '/icons/updated.png',
  appSettings: '/icons/app-settings.png',
  docsCheck: '/icons/docs-check.svg',
  bordroPng: '/icons/bordro.png',
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PERSONNEL_ICON_SRC[name]}
      alt=""
      className={`object-contain ${className}`}
      width={64}
      height={64}
      draggable={false}
      aria-hidden
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
  sm: 'h-[1.7rem] w-[1.7rem]',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
} as const;

export function PersonnelIconBadge({
  name,
  size = 'sm',
  active = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-slate-200/90 ${BADGE_BOX[size]} ${
        active ? 'ring-2 ring-[#0E1548]/35' : ''
      } ${className}`}
    >
      <PersonnelAssetIcon name={name} className={BADGE_IMG[size]} />
    </span>
  );
}
