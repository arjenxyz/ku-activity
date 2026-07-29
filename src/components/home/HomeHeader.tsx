'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { BrandMark } from '@/components/brand/BrandMark';
import { LoginRoleButton } from '@/components/home/LoginRolePicker';
import { HomeDownloadBanner } from '@/components/home/HomeDownloadBanner';
import { APP_NAME } from '@/lib/brand';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

type HomeHeaderProps = {
  /** Renders the slim download prompt as part of the same fixed chrome (homepage only). */
  showDownloadBanner?: boolean;
};

export function HomeHeader({ showDownloadBanner = false }: HomeHeaderProps) {
  const strings = useRegistryStrings('components/home/HomeHeader');
  const tagline = strings.tagline;

  const navLinks = [
    { href: '#hero', label: strings.navLinks.hero },
    { href: '#features', label: strings.navLinks.features },
    { href: '#play-store', label: strings.navLinks.playStore },
    { href: '/apk', label: strings.navLinks.apk },
    { href: '#contact', label: strings.navLinks.contact },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const solidChrome = scrolled || isMenuOpen || bannerVisible;

  const syncChromeHeight = useCallback(() => {
    const el = headerRef.current;
    if (!el) return;
    document.documentElement.style.setProperty('--home-chrome-h', `${el.offsetHeight}px`);
  }, []);

  const handleBannerVisibility = useCallback(
    (visible: boolean) => {
      setBannerVisible(visible);
      // Remeasure after paint so dismissed height is accurate.
      requestAnimationFrame(syncChromeHeight);
    },
    [syncChromeHeight]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    syncChromeHeight();
    const ro = new ResizeObserver(syncChromeHeight);
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--home-chrome-h');
    };
  }, [syncChromeHeight, showDownloadBanner, bannerVisible]);

  useBodyScrollLock(isMenuOpen);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-safe-top ${
          solidChrome
            ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200/60'
            : 'bg-white/80 backdrop-blur-sm lg:bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-px">
          <div className="flex items-center justify-between py-1.5 sm:py-2">
            <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
              <BrandMark size="sm" className="!h-8 !w-8 sm:!h-9 sm:!w-9" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold text-gray-900 sm:text-base">{APP_NAME}</p>
                <p className="hidden truncate text-[10px] text-gray-500 sm:block">{tagline}</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-1.5 md:flex">
              <LanguageSwitch variant="compact" />
              <LoginRoleButton variant="header" showIcon={false} />
            </div>

            <div className="flex items-center gap-0.5 md:hidden">
              <button
                className="touch-target flex h-10 w-10 flex-col items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? strings.menuCloseAriaLabel : strings.menuOpenAriaLabel}
                aria-expanded={isMenuOpen}
              >
                <span
                  className={`bg-[#0E1548] block transition-all duration-300 h-0.5 w-5 rounded-sm ${
                    isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
                  }`}
                />
                <span
                  className={`bg-[#0E1548] block transition-all duration-300 h-0.5 w-5 rounded-sm my-1 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`bg-[#0E1548] block transition-all duration-300 h-0.5 w-5 rounded-sm ${
                    isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {showDownloadBanner ? (
          <HomeDownloadBanner onVisibilityChange={handleBannerVisibility} />
        ) : null}
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
        <nav
          className={`absolute top-0 right-0 h-full w-[min(100%,320px)] bg-white shadow-2xl transition-transform duration-300 safe-pt safe-pb ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col p-5 pt-16">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3 px-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {strings.mobileMenuTitle}
              </p>
              <LanguageSwitch variant="compact" />
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-none"
              data-allow-scroll
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="touch-target flex items-center rounded-xl px-3 py-3.5 font-medium text-gray-700 hover:bg-gray-50 active:bg-blue-50"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mt-3 shrink-0 border-t border-gray-200 pt-3">
              <LoginRoleButton variant="mobile" />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
