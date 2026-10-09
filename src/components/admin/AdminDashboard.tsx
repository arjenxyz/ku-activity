'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';

export function AdminDashboard() {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/session');
      const payload = (await response.json().catch(() => null)) as {
        session?: { name: string } | null;
      } | null;
      setName(payload?.session?.name?.trim() || null);
      setReady(true);
    })();
  }, []);

  const title = name ? `Merhaba, ${name}` : 'Hoş geldin';

  return (
    <div className="relative flex min-h-[min(72dvh,580px)] flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[28%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2D6AF6]/12 blur-3xl sm:h-[360px] sm:w-[360px]" />
        <div className="absolute bottom-[18%] left-[12%] h-40 w-40 rounded-full bg-[#0E1548]/[0.06] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgb(15_23_42/0.06)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      <div
        className={`flex max-w-lg flex-col items-center transition duration-500 ${
          ready ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <BrandMark size="lg" variant="admin" className="!h-14 !w-14 shadow-md shadow-[#0E1548]/15" />

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Admin
        </p>

        <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-[#0E1548] sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Yönetim paneline hoş geldin. Etkinlikler, ekip ve diğer araçlara menüden ulaşabilirsin.
        </p>

        <div className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#2D6AF6]/50 to-transparent" />

        <Link
          href="/admin/egitim"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#2D6AF6] transition hover:text-[#0E1548]"
        >
          Panel Eğitimi
          <FiArrowRight
            className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
