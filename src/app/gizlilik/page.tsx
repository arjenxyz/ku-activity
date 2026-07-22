import type { Metadata } from 'next';
import { LegalDocumentShell } from '@/components/legal/LegalDocumentShell';
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
  const lastUpdated = `${strings.lastUpdatedPrefix} ${new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  return (
    <LegalDocumentShell
      documentLabel={strings.headerSubtitle}
      title={strings.title}
      lastUpdated={lastUpdated}
      backLabel={strings.backLabel}
      footerLinks={[
        { href: '/', label: strings.footer.home },
        { href: '/kvkk', label: strings.footer.kvkk },
        { href: '/kullanim-sartlari', label: strings.footer.terms },
      ]}
    >
      <h2>{strings.sections.who.heading}</h2>
      <p>
        {formatString(strings.sections.who.bodyPrefix, {
          developerLine: s.developerLine,
          noCompanyLine: s.noCompanyLine,
        })}{' '}
        <a href={p.url}>{p.url}</a>
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
        <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>{' '}
        {strings.sections.rights.bodySuffix}
      </p>

      <h2>{strings.sections.volunteer.heading}</h2>
      <p>{s.optionalUseLine}</p>
    </LegalDocumentShell>
  );
}
