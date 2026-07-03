'use client';

import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { ScrollingBanner } from '@/components/home/ScrollingBanner';
import { TrustBar } from '@/components/home/TrustBar';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { PlayStoreSection } from '@/components/home/PlayStoreSection';
import { CTASection } from '@/components/home/CTASection';
import { HomeFooter } from '@/components/home/HomeFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 scroll-smooth">
      <HomeHeader />
      <main>
        <HeroSection />
        <ScrollingBanner />
        <TrustBar />
        <FeaturesSection />
        <PlayStoreSection />
        <CTASection />
      </main>
      <HomeFooter />
    </div>
  );
}
