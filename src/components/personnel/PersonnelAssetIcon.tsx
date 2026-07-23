/** Personel menü / dock PNG ikonları (`public/icons`) */

export const PERSONNEL_ICON_SRC = {
  home: '/icons/home.png',
  work: '/icons/takvim.png',
  yoklama: '/icons/qr.png',
  finance: '/icons/bordro.png',
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
} as const;

export type PersonnelIconName = keyof typeof PERSONNEL_ICON_SRC;

type Props = {
  name: PersonnelIconName;
  className?: string;
};

/** Siyah zeminli illüstrasyonlar — lighten ile arka plan erir. */
export function PersonnelAssetIcon({ name, className = 'h-7 w-7' }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PERSONNEL_ICON_SRC[name]}
      alt=""
      className={`object-contain mix-blend-lighten ${className}`}
      width={64}
      height={64}
      draggable={false}
      aria-hidden
    />
  );
}
