'use client';

import { useEffect, useState } from 'react';
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi';
import { btnPrimary } from '@/components/ui/styles';

const EVENT_NAME = 'Kampüs tanışma buluşması';

type FocusField = 'event' | 'submit' | 'done';

function RegisterPreview({
  compact = false,
  eventName,
  focus,
}: {
  compact?: boolean;
  eventName: string;
  focus: FocusField;
}) {
  const buttonLabel = focus === 'submit' ? 'Katılım kaydediliyor…' : focus === 'done' ? 'Katılımın alındı' : 'Etkinliğe katıl';

  return (
    <div className={compact ? 'bg-slate-50 p-4' : 'bg-gradient-to-b from-white to-slate-50 p-6'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">Etkinlik kaydı</p>
      <h3 className={`mt-1 font-bold text-[#0E1548] ${compact ? 'text-base' : 'text-xl'}`}>
        Sana uygun etkinliğe katıl
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Etkinliği seç, detayları incele ve yerini ayır.
      </p>
      <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">Yaklaşan etkinlik</p>
            <p className="mt-1 truncate text-sm font-bold text-[#0E1548]">{eventName || 'Etkinlik seç'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
            Kontenjan var
          </span>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          <span className="inline-flex items-center gap-1.5"><FiCalendar className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> 18 Mayıs</span>
          <span className="inline-flex items-center gap-1.5"><FiMapPin className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> Kampüs</span>
          <span className="inline-flex items-center gap-1.5"><FiUsers className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> 24 kişi</span>
        </div>
      </div>
      <div
        className={`${btnPrimary} pointer-events-none mt-4 !w-full ${focus === 'submit' ? 'opacity-80' : ''} ${
          focus === 'done' ? 'bg-[#152060]' : ''
        }`}
      >
        {buttonLabel}
      </div>
    </div>
  );
}

export function RegistrationPreview() {
  const [eventName, setEventName] = useState('');
  const [focus, setFocus] = useState<FocusField>('event');

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      setEventName(EVENT_NAME);
      setFocus('done');
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    async function typeInto(text: string, write: (value: string) => void, field: FocusField) {
      setFocus(field);
      for (let index = 1; index <= text.length; index += 1) {
        if (cancelled) return;
        write(text.slice(0, index));
        await wait(70);
      }
    }

    async function play() {
      while (!cancelled) {
        setEventName('');
        setFocus('event');
        await wait(500);
        if (cancelled) return;
        await typeInto(EVENT_NAME, setEventName, 'event');
        await wait(350);
        if (cancelled) return;
        setFocus('submit');
        await wait(700);
        if (cancelled) return;
        setFocus('done');
        await wait(1800);
      }
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mx-auto hidden w-full max-w-sm sm:block lg:hidden" aria-hidden>
        <div className="rounded-[2rem] border-[10px] border-[#0E1548] bg-[#0E1548] shadow-xl shadow-slate-900/15">
          <div className="overflow-hidden rounded-[1.25rem] bg-white">
            <div className="flex justify-center bg-white py-2">
              <span className="h-1.5 w-16 rounded-full bg-slate-200" />
            </div>
            <RegisterPreview compact eventName={eventName} focus={focus} />
          </div>
        </div>
      </div>

      <div className="hidden lg:block" aria-hidden>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
              /kayit
            </span>
          </div>
          <RegisterPreview eventName={eventName} focus={focus} />
        </div>
      </div>
    </>
  );
}
