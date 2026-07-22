import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { LegalBackButton } from '@/components/legal/LegalBackButton';
import { APP_NAME } from '@/lib/brand';

type FooterLink = { href: string; label: string };

export function LegalDocumentShell({
  documentLabel,
  title,
  lastUpdated,
  backLabel,
  children,
  footerLinks,
}: {
  documentLabel: string;
  title: string;
  lastUpdated: string;
  backLabel: string;
  children: React.ReactNode;
  footerLinks: FooterLink[];
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <LegalBackButton label={backLabel} />
          <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" aria-hidden />
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                {APP_NAME}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{documentLabel}</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-6 sm:px-8 sm:py-8 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {documentLabel}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{lastUpdated}</p>
          </div>

          <div className="legal-prose px-5 py-7 sm:px-8 sm:py-9">{children}</div>
        </article>

        <nav
          className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm text-slate-500 dark:text-slate-400"
          aria-label="İlgili belgeler"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-[#0E1548] underline-offset-2 hover:underline dark:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
