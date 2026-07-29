'use client';

import { useMemo } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { BrandLogo } from '@/components/home/BrandLogo';

const DEFAULT_DURATIONS = [26, 32, 28, 34];
const DEFAULT_OFFSETS = [0, 9, 4, 14];

function splitIntoColumns(brands: string[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as string[]);
  brands.forEach((brand, index) => {
    columns[index % columnCount].push(brand);
  });
  return columns;
}

function FallingLogoColumn({
  brands,
  durationSec,
  offsetSec,
  compact,
}: {
  brands: string[];
  durationSec: number;
  offsetSec: number;
  compact?: boolean;
}) {
  const loop = [...brands, ...brands];

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div
        className="trusted-logos-fall flex flex-col items-center gap-4 py-2"
        style={{
          animationDuration: `${durationSec}s`,
          animationDelay: `-${offsetSec}s`,
        }}
      >
        {loop.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={`flex w-full shrink-0 items-center justify-center rounded-xl bg-white/95 shadow-sm ring-1 ring-slate-200/70 ${
              compact ? 'px-3 py-2.5' : 'px-4 py-3'
            }`}
          >
            <BrandLogo name={name} size="compact" />
          </div>
        ))}
      </div>
    </div>
  );
}

type TrustedLogosFallProps = {
  columnCount?: number;
  fadeFrom?: string;
  heightClass?: string;
  compact?: boolean;
  className?: string;
};

export function TrustedLogosFall({
  columnCount = 2,
  fadeFrom = 'white',
  heightClass = 'h-[min(28rem,52vh)]',
  compact = false,
  className = '',
}: TrustedLogosFallProps) {
  const strings = useRegistryStrings('components/home/HomeTrustedLogos');
  const allBrands = useMemo(() => strings.brands.flat(), [strings.brands]);
  const columns = useMemo(() => splitIntoColumns(allBrands, columnCount), [allBrands, columnCount]);

  return (
    <div className={`relative ${heightClass} ${className}`} aria-hidden>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent"
        style={{ backgroundImage: `linear-gradient(to bottom, ${fadeFrom}, transparent)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t to-transparent"
        style={{ backgroundImage: `linear-gradient(to top, ${fadeFrom}, transparent)` }}
        aria-hidden
      />

      <div
        className="grid h-full gap-3 xl:gap-4"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {columns.map((column, index) => (
          <FallingLogoColumn
            key={index}
            brands={column}
            durationSec={DEFAULT_DURATIONS[index] ?? 28}
            offsetSec={DEFAULT_OFFSETS[index] ?? 0}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

