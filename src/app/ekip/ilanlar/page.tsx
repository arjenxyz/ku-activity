'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiArrowUpRight, FiBriefcase, FiCalendar, FiUsers } from 'react-icons/fi';
import { HomeHeader } from '@/components/home/HomeHeader';
import { createClient } from '@/utils/supabase/client';

type Opening = { id: string; title: string; description: string | null; created_at?: string };

const DEMO_OPENINGS: Opening[] = [
  {
    id: 'opening_demo_active',
    title: '2026 Gönüllü Ekip',
    description:
      'Etkinlik günlerinde check-in, karşılama ve saha desteği için gönüllü ekip arkadaşları arıyoruz.',
  },
  {
    id: 'opening_demo_social',
    title: 'Sosyal Medya ve İletişim Ekibi',
    description:
      'Etkinlik duyuruları, sosyal medya içerikleri ve katılımcı iletişimi için yaratıcı ekip arkadaşları arıyoruz.',
  },
];

export default function TeamOpeningsPage() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const supabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? createClient()
          : null;
      if (!supabase) {
        setOpenings(DEMO_OPENINGS);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('team_openings')
        .select('id, title, description, created_at')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      setOpenings(data?.length ? data : DEMO_OPENINGS);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#e7f3fb] via-[#f5fbff] to-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+1.5rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <main className="mx-auto w-full max-w-5xl">
        <Link href="/ekip" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6AF6] hover:underline">
          <FiArrowLeft className="h-4 w-4" aria-hidden /> Ekip sayfasına dön
        </Link>
        <div className="mt-8 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f0ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">
            <FiBriefcase className="h-3.5 w-3.5" aria-hidden /> Gönüllü fırsatları
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0E1548] sm:text-4xl">
            Sana uygun ekibi seç
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            İlanları incele, sana en uygun gönüllü görevini seç ve başvuru formunu doldur.
          </p>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-slate-500">İlanlar yükleniyor…</p>
        ) : openings.length ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {openings.map((opening) => (
              <li key={opening.id}>
                <article className="group h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#2D6AF6]/35 hover:shadow-lg hover:shadow-blue-900/[0.08] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f0ff] text-[#2D6AF6]">
                      <FiUsers className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Başvuru açık
                    </span>
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-[#0E1548]">{opening.title}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600">
                    {opening.description || 'Gönüllü ekibimizin bir parçası olmak için başvurunu ilet.'}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <FiCalendar className="h-4 w-4 text-[#2D6AF6]" aria-hidden />
                    Başvurular değerlendiriliyor
                  </div>
                  <Link
                    href={`/ekip/ilanlar/${opening.id}`}
                    className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0E1548] text-sm font-semibold text-white transition hover:bg-[#152060]"
                  >
                    İlanı incele ve başvur <FiArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-3xl border border-blue-100 bg-white/70 p-8 text-center">
            <h2 className="text-lg font-bold text-[#0E1548]">Şu anda açık ilan yok</h2>
            <p className="mt-2 text-sm text-slate-600">Yeni ekip fırsatları yayınlandığında burada görebilirsin.</p>
          </div>
        )}
      </main>
    </div>
  );
}
