import strings from '@json/src/lib/platform-legal-content.json';
import { getPlatformInfo } from '@/lib/platform-config';
import { formatString } from '@/lib/strings/format';

/** Ana sayfa ve statik yasal sayfalar için ortak özet metinler */
export function getVolunteerProjectSummary() {
  const p = getPlatformInfo();
  const vars = {
    name: p.name,
    developerName: p.developerName,
    nature: p.nature,
    establishedNote: p.establishedNote,
    legalDisclaimer: p.legalDisclaimer,
  };

  return {
    title: strings.title,
    developerLine: formatString(strings.developerLine, vars),
    noCompanyLine: formatString(strings.noCompanyLine, vars),
    optionalUseLine: strings.optionalUseLine,
    transparencyLine: strings.transparencyLine,
    legalLine: formatString(strings.legalLine, vars),
  };
}
