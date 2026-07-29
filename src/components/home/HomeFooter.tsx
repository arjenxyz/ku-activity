'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { GooglePlayBadge } from '@/components/home/GooglePlayBadge';
import { SkyTwinkleStars } from '@/components/home/SkyTwinkleStars';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { APP_NAME } from '@/lib/brand';
import { PLAY_STORE_BADGE_TR, PLAY_STORE_PERSONNEL_URL, STORE_BADGE_SM_CLASS, STORE_BADGE_SM_HEIGHT, STORE_BADGE_SM_LINK_CLASS, STORE_BADGE_SM_WIDTH } from '@/lib/play-store';
import { SUPPORT_EMAIL } from '@/lib/support-email';

function FooterSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7FAEFF]">
      {children}
    </h4>
  );
}

function FooterNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-slate-300 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

export function HomeFooter() {
  const strings = useRegistryStrings('components/home/HomeFooter');
  const headerStrings = useRegistryStrings('components/home/HomeHeader');
  const playStoreStrings = useRegistryStrings('components/home/GooglePlayBadge');
  const playStoreHref = PLAY_STORE_PERSONNEL_URL || '#play-store';
  const playStoreEnabled = Boolean(PLAY_STORE_PERSONNEL_URL);

  const navLinks = [
    { href: '#hero', label: headerStrings.navLinks.hero },
    { href: '#features', label: headerStrings.navLinks.features },
    { href: '#play-store', label: headerStrings.navLinks.playStore },
    { href: '/apk', label: headerStrings.navLinks.apk },
  ];

  const legalLinks = [
    { href: '/gizlilik', label: strings.links.privacy },
    { href: '/kullanim-sartlari', label: strings.links.terms },
    { href: '/kvkk', label: strings.links.kvkk },
    { href: '/gizlilik', label: strings.legalHub },
  ];

  return (
    <footer id="contact" className="section_footer bg-[#0E1548] text-white">
      <div className="relative w-full overflow-hidden">
        <Image
          src="/footer.png"
          alt={strings.bannerAlt}
          width={1842}
          height={854}
          className="block h-auto w-full object-cover object-bottom"
          sizes="100vw"
        />
        <SkyTwinkleStars maskSolidEnd={24} maskFadeEnd={38} maxTopPercent={30} density={44} />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#0E1548] sm:h-16"
          aria-hidden
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          <div className="space-y-5 lg:col-span-4 xl:col-span-5">
            <div className="flex items-center gap-3">
              <BrandMark size="lg" className="ring-2 ring-white/15" />
              <div>
                <h3 className="text-lg font-bold tracking-tight">{APP_NAME}</h3>
                <p className="text-sm text-slate-400">{strings.tagline}</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">{strings.description}</p>
            <div className="flex flex-wrap items-center gap-2.5">
              {['twitter', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  aria-label={social}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {social === 'twitter' ? (
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    ) : (
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    )}
                  </svg>
                </a>
              ))}
              {playStoreEnabled ? (
                <GooglePlayBadge href={playStoreHref} enabled size="sm" />
              ) : (
                <Link href="#play-store" className={STORE_BADGE_SM_LINK_CLASS} aria-label={playStoreStrings.downloadAriaLabel}>
                  <Image
                    src={PLAY_STORE_BADGE_TR}
                    alt={playStoreStrings.badgeAlt}
                    width={STORE_BADGE_SM_WIDTH}
                    height={STORE_BADGE_SM_HEIGHT}
                    className={STORE_BADGE_SM_CLASS}
                    unoptimized
                  />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-3 xl:col-span-4">
            <div>
              <FooterSectionTitle>{strings.navTitle}</FooterSectionTitle>
              <nav className="flex flex-col gap-2.5">
                {navLinks.map((link) => (
                  <FooterNavLink key={link.href} href={link.href}>
                    {link.label}
                  </FooterNavLink>
                ))}
              </nav>
            </div>

            <div>
              <FooterSectionTitle>{strings.legalTitle}</FooterSectionTitle>
              <nav className="flex flex-col gap-2.5">
                {legalLinks.map((link) => (
                  <FooterNavLink key={`${link.href}-${link.label}`} href={link.href}>
                    {link.label}
                  </FooterNavLink>
                ))}
              </nav>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <FooterSectionTitle>{strings.contactTitle}</FooterSectionTitle>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
              >
                <svg className="h-4 w-4 shrink-0 text-[#7FAEFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="break-all">{SUPPORT_EMAIL}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <BrandMark size="sm" className="ring-1 ring-white/10" />
            <span>
              {strings.copyrightYear} {strings.companyName}
              <span className="mx-2 text-white/20" aria-hidden>
                ·
              </span>
              {strings.rightsReserved}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
