import Link from 'next/link';

export function HomeFooter() {
  return (
    <footer className="mt-auto bg-white">
      <nav className="hidden items-center justify-center gap-6 px-4 pt-4 md:flex" aria-label="Yasal">
        <Link href="/gizlilik" className="text-sm text-slate-600 hover:text-[#0E1548]">
          Gizlilik
        </Link>
        <Link href="/kvkk" className="text-sm text-slate-600 hover:text-[#0E1548]">
          KVKK
        </Link>
      </nav>
      <p className="px-4 py-4 text-center text-xs tracking-wide text-slate-500">
        <span className="text-slate-400">© 2026 </span>
        <a
          href="https://arjenofficial.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-700 hover:text-[#0E1548]"
        >
          Arjen
        </a>
        <span>. Tüm hakları saklıdır.</span>
      </p>
    </footer>
  );
}
