import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';
import { getVolunteerProjectSummary } from '@/lib/platform-legal-content';
import { formatString } from '@/lib/strings/format';
import strings from '@json/src/app/gizlilik/page.json';

export const metadata: Metadata = {
  title: strings.metadataTitle,
  description: strings.metadataDescription,
};

export default function PrivacyPage() {
  const p = getPlatformInfo();
  const s = getVolunteerProjectSummary();

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
        <p className="lead text-slate-600">
          {strings.lastUpdatedPrefix}{' '}
          {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h2>{strings.sections.who.heading}</h2>
        <p>
          {formatString(strings.sections.who.bodyPrefix, {
            developerLine: s.developerLine,
            noCompanyLine: s.noCompanyLine,
          })}{' '}
          <a href={p.url} className="text-blue-600 hover:underline">
            {p.url}
          </a>
        </p>

        <h2>{strings.sections.dataCollected.heading}</h2>
        <ul>
          <li>
            <strong>{strings.sections.dataCollected.personnel}</strong>{' '}
            {strings.sections.dataCollected.personnelDetail}
          </li>
          <li>
            <strong>{strings.sections.dataCollected.admin}</strong>{' '}
            {strings.sections.dataCollected.adminDetail}
          </li>
          <li>
            <strong>{strings.sections.dataCollected.technical}</strong>{' '}
            {strings.sections.dataCollected.technicalDetail}
          </li>
        </ul>

        <h2>{strings.sections.transparency.heading}</h2>
        <p>{s.transparencyLine}</p>

        <h2>{strings.sections.purposes.heading}</h2>
        <p>{strings.sections.purposes.body}</p>

        <h2>{strings.sections.security.heading}</h2>
        <p>{strings.sections.security.body}</p>

        <h2>{strings.sections.thirdParties.heading}</h2>
        <p>{strings.sections.thirdParties.body}</p>

        <h2>{strings.sections.devicePermissions.heading}</h2>
        <p>{strings.sections.devicePermissions.body}</p>

        <h2>{strings.sections.rights.heading}</h2>
        <p>
          {strings.sections.rights.bodyPrefix}{' '}
          <a href={`mailto:${p.contactEmail}`} className="text-blue-600 hover:underline">
            {p.contactEmail}
          </a>{' '}
          {strings.sections.rights.bodySuffix}
        </p>

        <h2>{strings.sections.volunteer.heading}</h2>
        <p>{s.optionalUseLine}</p>

        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            {strings.footer.home}
          </Link>
          <Link href="/kvkk" className="text-blue-600 hover:underline">
            {strings.footer.kvkk}
          </Link>
          <Link href="/kullanim-sartlari" className="text-blue-600 hover:underline">
            {strings.footer.terms}
          </Link>
        </p>
      </main>
    </div>
  );
}
