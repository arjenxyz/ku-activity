'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function AdminDashboard() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/session');
      const payload = (await response.json().catch(() => null)) as {
        session?: { name: string } | null;
      } | null;
      setName(payload?.session?.name?.trim() || null);
    })();
  }, []);

  const title = name ? `Merhaba, ${name}` : 'Hoş geldin';

  return (
    <div className="flex min-h-[min(70dvh,560px)] flex-col items-center justify-center px-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#0E1548] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Yönetim paneline hoş geldin. Etkinlikler, ekip ve diğer araçlara menüden ulaşabilirsin.
      </p>
      <Link
        href="/admin/egitim"
        className="mt-6 text-sm font-medium text-[#2D6AF6] underline-offset-4 hover:underline"
      >
        Panel Eğitimi
      </Link>
    </div>
  );
}
