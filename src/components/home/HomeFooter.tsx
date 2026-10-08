import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

const LINKS = [
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kvkk', label: 'KVKK' },
  { href: '/kullanim-sartlari', label: 'Kullanım şartları' },
];

export function HomeFooter() {
  return (
    <footer id="iletisim" className="mt-auto bg-[#0E1548] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" className="ring-2 ring-white/15" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-slate-300">{APP_TAGLINE}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Yasal">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-200 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
          Üniversiteye bağlı değildir. Üniversite içi etkinlikler için kullanılır.
        </p>
      </div>
    </footer>
  );
}
