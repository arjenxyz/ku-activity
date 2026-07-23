import { PERSONNEL_ICON_SRC } from '@/components/personnel/PersonnelAssetIcon';

/** Bordro — Docs check illüstrasyonu */
export function BordroIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- animated SVG asset
    <img
      src={PERSONNEL_ICON_SRC.docsCheck}
      alt=""
      className={`object-contain ${className}`}
      width={64}
      height={64}
      draggable={false}
      aria-hidden
    />
  );
}
