'use client';

import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { ScrollingBanner } from '@/components/home/ScrollingBanner';
import { TrustBar } from '@/components/home/TrustBar';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { CTASection } from '@/components/home/CTASection';
import { HomeFooter } from '@/components/home/HomeFooter';
import { useHomeStats } from '@/hooks/useHomeStats';

export default function Home() {
  const stats = useHomeStats();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 scroll-smooth">
      <HomeHeader />
      <main>
        <HeroSection stats={stats} />
        <ScrollingBanner />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <HomeFooter />
    </div>
  );
}
