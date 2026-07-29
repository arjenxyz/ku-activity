'use client';

import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { BrandLogo } from '@/components/home/BrandLogo';

export function HomeTrustedLogos() {
  const strings = useRegistryStrings('components/home/HomeTrustedLogos');

  return (
    <section
      className="logolar-section border-y border-sky-100/80 bg-[#f3f8fc] py-10 sm:py-12 lg:hidden"
      aria-label={strings.title}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-4xl text-center text-[0.68rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-slate-500 sm:text-xs">
          {strings.title}
        </p>

        <div className="mt-8 space-y-7 sm:mt-10 sm:space-y-8">
          {strings.brands.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-10"
            >
              {row.map((brand) => (
                <BrandLogo key={brand} name={brand} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
