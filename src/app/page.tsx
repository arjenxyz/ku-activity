'use client';

import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { ScrollingBanner } from '@/components/home/ScrollingBanner';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { PlayStoreSection } from '@/components/home/PlayStoreSection';
import { HomeFooter } from '@/components/home/HomeFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white scroll-smooth dark:bg-[#0b1220]">
      <HomeHeader />
      <main>
        <HeroSection />
        <ScrollingBanner />
        <FeaturesSection />
        <PlayStoreSection />
      </main>
      <HomeFooter />
    </div>
  );
}
