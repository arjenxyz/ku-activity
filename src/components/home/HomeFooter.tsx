import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function HomeFooter() {
  return (
    <footer id="iletisim" className="bg-[#0E1548] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size="sm" className="ring-2 ring-white/15" />
            <div>
              <p className="text-sm font-bold">{APP_NAME}</p>
              <p className="text-xs text-slate-300">{APP_TAGLINE}</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-300">
            Etkinlik katılımcıları ve maliyeti burada hesaplanır, ayrıntılar kamuoyuna açık paylaşılır.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FAEFF]">Sayfa</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/login" className="hover:text-white">Giriş</Link>
          </nav>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FAEFF]">Yasal</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/gizlilik" className="hover:text-white">Gizlilik</Link>
            <Link href="/kvkk" className="hover:text-white">KVKK</Link>
            <Link href="/kullanim-sartlari" className="hover:text-white">Kullanım şartları</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400 sm:px-6">
Üniversiteye bağlı değildir. Üniversite içi etkinlikler için kullanılır.
      </div>
    </footer>
  );
}
