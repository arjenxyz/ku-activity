/** Bordro — Docs check illüstrasyonu */
export function BordroIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- animated SVG asset
    <img
      src="/icons/docs-check.svg"
      alt=""
      className={className}
      width={48}
      height={48}
      draggable={false}
      aria-hidden
    />
  );
}
