'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

export function SponsorDetailModal({
  sponsor,
  onClose,
}: {
  sponsor: StoredSponsor;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(true);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
      onClick={onClose}
    >
      <section
        data-scroll-lock-allow=""
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[#e8f0ff] via-[#f7fbff] to-white px-6">
          {sponsor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsor.logoUrl}
              alt=""
              className="max-h-28 w-full max-w-[12rem] object-contain"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0E1548] text-3xl font-semibold text-white">
              {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
            </span>
          )}
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#0E1548] shadow-sm ring-1 ring-slate-200 hover:bg-white"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <h2 id={titleId} className="text-xl font-semibold text-[#0E1548]">
            {sponsor.name}
          </h2>
          {sponsor.blurb ? (
            <p className="mt-1 text-sm font-medium text-[#2D6AF6]">{sponsor.blurb}</p>
          ) : null}
          {sponsor.about ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{sponsor.about}</p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Bu sponsor etkinliklere destek verir.
            </p>
          )}

          {sponsor.url ? (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152060]"
            >
              Web sitesini aç
              <FiExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  );
}
