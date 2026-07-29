'use client';

import { useEffect } from 'react';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { ScrollingBanner } from '@/components/home/ScrollingBanner';
import { HomeStoriesSlider } from '@/components/home/HomeStoriesSlider';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HomeMobileShowcase } from '@/components/home/HomeMobileShowcase';
import { PlayStoreSection } from '@/components/home/PlayStoreSection';
import { HomeFaqSection } from '@/components/home/HomeFaqSection';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeDownloadBanner } from '@/components/home/HomeDownloadBanner';

/** Landing her zaman aydınlık — dark class varsa kaldır. */
function useForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    const prev = localStorage.getItem('theme');
    if (prev === 'dark') {
      localStorage.setItem('theme', 'light');
    }
  }, []);
}

export default function Home() {
  useForceLightTheme();

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <HomeHeader />
      <main>
        <HeroSection />
        <ScrollingBanner />
        <HomeStoriesSlider />
        <FeaturesSection />
        <HomeMobileShowcase />
        <PlayStoreSection />
        <HomeFaqSection />
      </main>
      <HomeFooter />
      <HomeDownloadBanner />
    </div>
  );
}
