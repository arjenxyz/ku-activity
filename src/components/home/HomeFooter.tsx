import Link from 'next/link';

const LINKS = [
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kvkk', label: 'KVKK' },
  { href: '/kullanim-sartlari', label: 'Kullanım şartları' },
];

export function HomeFooter() {
  return (
    <footer id="iletisim" className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-xs leading-relaxed text-slate-500">
          Üniversiteye bağlı değildir. Üniversite içi etkinlikler için kullanılır.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Yasal">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs text-slate-500 hover:text-[#0E1548]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
