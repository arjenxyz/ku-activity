import Link from 'next/link';

const LINKS = [
  { href: '/gizlilik', label: 'Gizlilik' },
  { href: '/kvkk', label: 'KVKK' },
  { href: '/kullanim-sartlari', label: 'Kullanım şartları' },
];

export function HomeFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-center sm:gap-6">
        <p className="text-sm text-slate-600">
          <a
            href="https://github.com/arjenxyz"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#0E1548] underline decoration-[#0E1548]/30 underline-offset-2 hover:decoration-[#0E1548]"
          >
            Arjen
          </a>{' '}
          tarafından geliştirilmiştir
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Yasal">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-600 hover:text-[#0E1548]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
