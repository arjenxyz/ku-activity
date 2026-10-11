'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

function SponsorCard({ sponsor }: { sponsor: StoredSponsor }) {
  const body = (
    <>
      <div className="flex h-20 items-center justify-center rounded-xl bg-[#f4f8fd] px-3 py-2 sm:h-24">
        {sponsor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.logoUrl}
            alt=""
            className="h-full w-full max-w-[9rem] object-contain"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0E1548] text-lg font-semibold text-white">
            {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#0E1548]">{sponsor.name}</p>
      {sponsor.blurb ? <p className="mt-0.5 text-xs text-slate-500">{sponsor.blurb}</p> : null}
    </>
  );

  const className =
    'flex flex-col rounded-2xl border border-slate-200/80 bg-white px-3 py-3 text-center sm:px-4 sm:py-4';

  if (sponsor.url) {
    return (
      <a
        href={sponsor.url}
        target="_blank"
        rel="noreferrer"
        className={`${className} transition hover:border-[#2D6AF6]/35 hover:bg-[#f8fbff]`}
      >
        {body}
      </a>
    );
  }

  return <div className={className}>{body}</div>;
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
  }, [refresh]);

  if (sponsors.length === 0) return null;

  return (
    <section className="relative border-t border-slate-100 bg-gradient-to-b from-white via-[#f7fbff] to-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Sponsorlarımız
        </p>
        <h2 className="mt-1.5 text-center text-base font-semibold text-[#0E1548] sm:text-lg">
          Destekleyenler
        </h2>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              <SponsorCard sponsor={sponsor} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
