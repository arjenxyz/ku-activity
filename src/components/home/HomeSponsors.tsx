'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiArrowUpRight, FiHeart, FiMail } from 'react-icons/fi';
import { SponsorDetailModal } from '@/components/home/SponsorDetailModal';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

function SponsorCard({
  sponsor,
  onOpen,
}: {
  sponsor: StoredSponsor;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col items-center text-center transition duration-300"
    >
      <div className="flex h-24 w-full items-center justify-center px-4 sm:h-28">
        {sponsor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsor.logoUrl}
            alt=""
            className="h-full w-full max-w-[12rem] object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0ff] text-xl font-semibold text-[#0E1548]">
            {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
          </span>
        )}
      </div>
      <span className="mt-3 text-sm font-semibold text-[#0E1548] transition-colors group-hover:text-[#2D6AF6]">
        {sponsor.name}
      </span>
      {sponsor.blurb ? <span className="mt-1 text-xs leading-5 text-slate-500">{sponsor.blurb}</span> : null}
    </button>
  );
}

export function HomeSponsors({ initialSponsors }: { initialSponsors: StoredSponsor[] }) {
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [selected, setSelected] = useState<StoredSponsor | null>(null);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [resumeTimer, setResumeTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  const pauseMarquee = () => {
    if (resumeTimer) clearTimeout(resumeTimer);
    setMarqueePaused(true);
    setResumeTimer(null);
  };

  const resumeMarqueeAfterDelay = () => {
    if (resumeTimer) clearTimeout(resumeTimer);
    const timer = setTimeout(() => {
      setMarqueePaused(false);
      setResumeTimer(null);
    }, 2000);
    setResumeTimer(timer);
  };

  const cards = [
    ...sponsors.map((sponsor) => ({
      id: sponsor.id,
      content: (
        <SponsorCard
          sponsor={sponsor}
          onOpen={() => setSelected(sponsor)}
        />
      ),
    })),
    {
      id: 'sponsor-contact',
      content: (
        <a
          href="https://arjenofficial.com"
          target="_blank"
          rel="noreferrer"
          className="group flex min-h-[152px] h-full items-center justify-between gap-5 overflow-hidden rounded-[1.35rem] border border-[#cfe0ff] bg-[#0E1548] px-5 py-5 text-left shadow-[0_16px_40px_rgba(14,21,72,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-[#152060] hover:shadow-[0_22px_48px_rgba(14,21,72,0.22)] sm:px-6"
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/15">
              <FiMail className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200">
                Birlikte üretelim
              </span>
              <span className="mt-1 block text-base font-bold text-white sm:text-lg">
                Sponsor olmak ister misiniz?
              </span>
              <span className="mt-1 block text-xs leading-5 text-blue-100/75">
                İş birliği fırsatlarını konuşmak için bizimle iletişime geçin.
              </span>
            </span>
          </span>
          <FiArrowUpRight className="h-5 w-5 shrink-0 text-white transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </a>
      ),
    },
  ];

  if (sponsors.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-gradient-to-b from-white via-[#f4f9ff] to-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute -right-24 top-8 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f0ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2D6AF6]">
              <FiHeart className="h-3.5 w-3.5" aria-hidden /> Birlikte güçlüyüz
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0E1548] sm:text-3xl">
              Etkinliklerimize değer katanlar
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Öğrenci deneyimini daha iyi hale getirmek için bize destek olan çözüm ortaklarımız.
            </p>
          </div>
        </div>

        <div
          className="mt-8 overflow-hidden"
          onPointerDown={pauseMarquee}
          onPointerUp={resumeMarqueeAfterDelay}
          onPointerCancel={resumeMarqueeAfterDelay}
          onMouseEnter={pauseMarquee}
          onMouseLeave={resumeMarqueeAfterDelay}
          aria-label="Sponsorlar"
        >
          <ul
            className="flex w-max gap-4"
            style={{
              animation: 'sponsor-marquee 36s linear infinite',
              animationPlayState: marqueePaused ? 'paused' : 'running',
            }}
          >
            {[...cards, ...cards].map((card, index) => (
              <li key={`${card.id}-${index}`} className="min-w-[min(84vw,25rem)] sm:min-w-[min(46vw,25rem)] lg:min-w-[min(31vw,22rem)]">
                {card.content}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Bir sponsorun detaylarını görmek için kartını seç.</p>
      </div>

      {selected ? (
        <SponsorDetailModal sponsor={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
}
