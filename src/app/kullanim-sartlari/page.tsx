import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';
import { getVolunteerProjectSummary } from '@/lib/platform-legal-content';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/app/kullanim-sartlari/page.json';

export const metadata: Metadata = {
  title: strings.metadataTitle,
  description: strings.metadataDescription,
};

export default function TermsPage() {
  const p = getPlatformInfo();
  const s = getVolunteerProjectSummary();

  return (
    <LegalPageShell title={strings.title}>
      <p className="lead text-slate-600">
        {strings.lastUpdatedPrefix}{' '}
        {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2>{strings.sections.nature.heading}</h2>
      <p>
        <strong>{p.name}</strong>
        {formatString(strings.sections.nature.platformLineSuffix, {
          url: p.url,
          developerName: p.developerName,
          nature: p.nature,
        })}
      </p>
      <p>{s.noCompanyLine}</p>

      <h2>{strings.sections.voluntary.heading}</h2>
      <p>{s.optionalUseLine}</p>
      <p>{strings.sections.voluntary.adminLine}</p>

      <h2>{strings.sections.scope.heading}</h2>
      <p>{strings.sections.scope.body}</p>

      <h2>{strings.sections.asIs.heading}</h2>
      <p>{strings.sections.asIs.body}</p>

      <h2>{strings.sections.legalValidity.heading}</h2>
      <p>
        <strong>{strings.sections.legalValidity.importantPrefix}</strong> {s.legalLine}
      </p>
      <ul>
        {strings.sections.legalValidity.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{strings.sections.liability.heading}</h2>
      <p>{formatString(strings.sections.liability.body, { developerName: p.developerName })}</p>

      <h2>{strings.sections.ip.heading}</h2>
      <p>{formatString(strings.sections.ip.body, { developerName: p.developerName })}</p>

      <h2>{strings.sections.contact.heading}</h2>
      <p>
        {strings.sections.contact.bodyPrefix}{' '}
        <a href={`mailto:${p.contactEmail}`} className="text-blue-600 hover:underline">
          {p.contactEmail}
        </a>
      </p>
    </LegalPageShell>
  );
}

function LegalPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <BrandMark size="sm" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate prose-sm sm:prose-base">
        <h1>{title}</h1>
        {children}
        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            {strings.shell.footerHome}
          </Link>
          <Link href="/gizlilik" className="text-blue-600 hover:underline">
            {strings.shell.footerPrivacy}
          </Link>
          <Link href="/kvkk" className="text-blue-600 hover:underline">
            {strings.shell.footerKvkk}
          </Link>
        </p>
      </main>
    </div>
  );
}
