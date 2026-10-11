'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

function SponsorChip({ sponsor }: { sponsor: StoredSponsor }) {
  const inner = (
    <>
      {sponsor.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sponsor.logoUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-md object-contain"
        />
      ) : (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0E1548]/8 text-[11px] font-semibold text-white"
          aria-hidden
        >
          {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#0E1548]">{sponsor.name}</span>
        {sponsor.blurb ? (
          <span className="block truncate text-[11px] text-slate-500">{sponsor.blurb}</span>
        ) : null}
      </span>
    </>
  );

  const className =
    'inline-flex min-w-[11rem] max-w-[16rem] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 shadow-sm shadow-slate-900/[0.03]';

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noreferrer"
        className={`${className} transition hover:border-[#2D6AF6]/35 hover:bg-[#e8f0ff]`}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function HomeSponsors({ initialSponsors }: { initialSponsors: StoredSponsor[] }) {
  const [sponsors, setSponsors] = useState(initialSponsors);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/sponsors', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as {
        sponsors?: StoredSponsor[];
      } | null;
      if (response.ok && payload?.sponsors) setSponsors(payload.sponsors);
    } catch {
      // keep last snapshot
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  if (sponsors.length === 0) return null;

  const loop = [...sponsors, ...sponsors];
  const duration = `${Math.max(28, sponsors.length * 8)}s`;

  return (
    <section className="relative border-t border-slate-100 bg-gradient-to-b from-white via-[#f7fbff] to-white px-0 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Sponsorlarımız
        </p>
        <h2 className="mt-1.5 text-center text-base font-semibold text-[#0E1548] sm:text-lg">
          Destekleyenler
        </h2>
      </div>

      <div
        className="relative mt-5 overflow-hidden"
        onMouseEnter={(e) => {
          e.currentTarget.querySelector('.features-marquee-track')?.classList.add('is-paused');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.querySelector('.features-marquee-track')?.classList.remove('is-paused');
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16" />

        <div className="overflow-x-auto scrollbar-hide">
          <div
            className="features-marquee-track flex w-max gap-3 px-4 sm:gap-4"
            style={{ ['--features-marquee-duration' as string]: duration }}
          >
            {loop.map((sponsor, index) => (
              <SponsorChip key={`${sponsor.id}-${index}`} sponsor={sponsor} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
