'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import type { CatalogEventStatus } from '@/lib/events/catalog';
import { STATUS_LABELS } from '@/lib/events/catalog';

const STATUS_OPTIONS: Array<{
  value: CatalogEventStatus;
  hint: string;
  tone: string;
  dot: string;
}> = [
  {
    value: 'published',
    hint: 'Listede görünür, kayıt henüz kapalı',
    tone: 'bg-[#e8f0ff] text-[#2D6AF6] ring-[#d6e4ff]',
    dot: 'bg-[#2D6AF6]',
  },
  {
    value: 'registration_open',
    hint: 'Öğrenciler kayıt olabilir',
    tone: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    value: 'registration_closed',
    hint: 'Yeni kayıt alınmaz',
    tone: 'bg-amber-50 text-amber-800 ring-amber-100',
    dot: 'bg-amber-500',
  },
  {
    value: 'completed',
    hint: 'Etkinlik tamamlandı',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
];

export function AdminStatusSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: CatalogEventStatus;
  onChange: (status: CatalogEventStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-label="Durum"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold ring-1 transition hover:brightness-[0.98] disabled:opacity-60 ${current.tone}`}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${current.dot}`} aria-hidden />
          <span className="truncate">{STATUS_LABELS[current.value]}</span>
        </span>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Durum seç"
          data-scroll-lock-allow=""
          className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200/80"
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    selected ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${option.dot}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0E1548]">{STATUS_LABELS[option.value]}</span>
                      {selected ? <FiCheck className="h-3.5 w-3.5 shrink-0 text-[#2D6AF6]" aria-hidden /> : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{option.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
