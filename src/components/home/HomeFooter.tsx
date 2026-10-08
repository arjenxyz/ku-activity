import Link from 'next/link';

const LINKS = [
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kvkk', label: 'KVKK' },
  { href: '/kullanim-sartlari', label: 'Kullanım şartları' },
];

export function HomeFooter() {
  return (
    <footer id="iletisim" className="mt-auto border-t border-slate-200/80 bg-white/80">
      <nav
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-4 sm:justify-end sm:px-8"
        aria-label="Yasal"
      >
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-xs text-slate-400 hover:text-[#0E1548]">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
