import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function HomeFooter() {
  return (
    <footer id="iletisim" className="bg-[#0E1548] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" className="ring-2 ring-white/15" />
              <div>
                <p className="text-sm font-bold sm:text-base">{APP_NAME}</p>
                <p className="text-xs text-slate-300">{APP_TAGLINE}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Etkinlik katılımcıları ve maliyeti burada hesaplanır, ayrıntılar kamuoyuna açık paylaşılır.
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FAEFF]">Yasal</p>
            <nav className="mt-3 flex flex-wrap gap-2 md:justify-end" aria-label="Yasal">
              <Link
                href="/gizlilik"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Gizlilik
              </Link>
              <Link
                href="/kvkk"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                KVKK
              </Link>
              <Link
                href="/kullanim-sartlari"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Kullanım şartları
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs leading-relaxed text-slate-400 sm:px-8 sm:text-left">
        <p className="mx-auto max-w-6xl">
          Üniversiteye bağlı değildir. Üniversite içi etkinlikler için kullanılır.
        </p>
      </div>
    </footer>
  );
}
