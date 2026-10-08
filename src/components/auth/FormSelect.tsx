'use client';

import { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { inputClass } from '@/components/auth/authStyles';
import type { Choice } from '@/lib/faculty';

export function FormSelect({
  id,
  value,
  onChange,
  placeholder,
  options,
  menuClassName,
  inline = false,
  onOpenChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Choice[];
  menuClassName?: string;
  inline?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  function setMenu(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${inputClass} flex items-center justify-between gap-3 text-left`}
        onClick={() => setMenu(!open)}
      >
        <span className={current ? 'text-gray-900' : 'text-gray-400'}>{current?.label ?? placeholder}</span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-labelledby={id}
          data-scroll-lock-allow=""
          className={`absolute z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/10 ${menuClassName ?? 'w-full'}`}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`w-full rounded-xl px-3 text-left ${inline ? 'py-2' : 'py-2.5'} ${selected ? 'bg-[#0E1548]/[0.06]' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    onChange(option.value);
                    setMenu(false);
                  }}
                >
                  {inline ? (
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[#0E1548]">{option.label}</span>
                      <span className="truncate text-xs text-slate-500">{option.hint}</span>
                    </span>
                  ) : (
                    <>
                      <span className="block text-sm font-medium text-[#0E1548]">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
