import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_SHORT_NAME, APP_TAGLINE } from '@/lib/brand';

const LINKS = [
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kvkk', label: 'KVKK' },
  { href: '/kullanim-sartlari', label: 'Kullanım şartları' },
];

function LegalLinks({ className }: { className?: string }) {
  return (
    <nav className={className} aria-label="Yasal">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm text-slate-200 transition hover:text-white">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function HomeFooter() {
  return (
    <>
      <aside
        id="iletisim"
        className="fixed bottom-0 left-0 top-[var(--home-chrome-h,4.5rem)] z-30 hidden w-52 flex-col justify-between bg-[#0E1548] px-5 py-8 text-white lg:flex"
      >
        <div>
          <BrandMark size="sm" className="ring-2 ring-white/15" />
          <p className="mt-4 text-sm font-bold tracking-tight">{APP_SHORT_NAME}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{APP_TAGLINE}</p>
        </div>
        <div>
          <LegalLinks className="flex flex-col gap-2" />
          <p className="mt-6 text-[11px] leading-relaxed text-slate-400">
            Üniversiteye bağlı değildir. Üniversite içi etkinlikler için kullanılır.
          </p>
        </div>
      </aside>

      <footer className="mt-auto bg-[#0E1548] text-white lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" className="ring-2 ring-white/15" />
            <p className="text-sm font-bold">{APP_SHORT_NAME}</p>
          </div>
          <LegalLinks className="flex flex-wrap gap-x-4 gap-y-2" />
        </div>
      </footer>
    </>
  );
}
