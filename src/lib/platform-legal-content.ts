import { getPlatformInfo } from '@/lib/platform-config';

/** Ana sayfa ve statik yasal sayfalar için ortak özet metinler */
export function getVolunteerProjectSummary() {
  const p = getPlatformInfo();
  return {
    title: 'Gönüllülük Projesi',
    developerLine: `${p.name}, ${p.developerName} tarafından geliştirilmiş ${p.nature}dur.`,
    noCompanyLine: p.establishedNote,
    optionalUseLine:
      'Hiçbir yönetici veya işveren, personeli bu platformu kullanmaya zorlayamaz. Kullanım tamamen gönüllüdür.',
    transparencyLine:
      'Yevmiye, avans, kesinti, asgari ücret, yoklama ve puantaj kayıtları hem yönetici hem personel panelinde görülebilir; amaç finansal takibi dijital ve şeffaf kılmaktır.',
    legalLine: p.legalDisclaimer,
  };
}
