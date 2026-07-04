import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/app/kvkk/page.json';

export const metadata: Metadata = {
  title: strings.metadataTitle,
  description: strings.metadataDescription,
};

export default function KvkkPage() {
  const p = getPlatformInfo();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <BrandMark size="sm" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-slate-500">{strings.headerSubtitle}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate prose-sm sm:prose-base">
        <h1>{strings.title}</h1>
        <p className="lead text-slate-600">{strings.lead}</p>

        <h2>{strings.sections.structure.heading}</h2>
        <p>
          <strong>{p.name}</strong>
          {formatString(strings.sections.structure.platformLine, {
            developerName: p.developerName,
            nature: p.nature,
          })}
        </p>
        <p>{strings.sections.structure.adminLine}</p>
        <p>
          <strong>{strings.sections.structure.operatorPrefix}</strong>{' '}
          {formatString(strings.sections.structure.operatorLine, { developerName: p.developerName })}{' '}
          <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>
        </p>

        <h2>{strings.sections.categories.heading}</h2>
        <ul>
          {strings.sections.categories.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{strings.sections.purposes.heading}</h2>
        <p>{strings.sections.purposes.body}</p>

        <h2>{strings.sections.legalBasis.heading}</h2>
        <p>{strings.sections.legalBasis.body}</p>

        <h2>{strings.sections.transfer.heading}</h2>
        <p>{strings.sections.transfer.body}</p>

        <h2>{strings.sections.security.heading}</h2>
        <p>{strings.sections.security.body}</p>

        <h2>{strings.sections.rights.heading}</h2>
        <p>
          {strings.sections.rights.bodyPrefix}{' '}
          <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>{' '}
          {strings.sections.rights.bodySuffix}
        </p>

        <h2>{strings.sections.retention.heading}</h2>
        <p>{strings.sections.retention.body}</p>

        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            {strings.footer.home}
          </Link>
          <Link href="/gizlilik" className="text-blue-600 hover:underline">
            {strings.footer.privacy}
          </Link>
          <Link href="/kullanim-sartlari" className="text-blue-600 hover:underline">
            {strings.footer.terms}
          </Link>
        </p>
      </main>
    </div>
  );
}
