'use client';

import { useEffect, useRef } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function ScrollingBanner() {
  const strings = useRegistryStrings('components/home/ScrollingBanner');
  const texts = strings.texts;
  const bannerRef = useRef<HTMLDivElement>(null);
  const speed = 120;

  useEffect(() => {
    let pos = 0;
    let animationFrame: number;

    const animate = () => {
      if (!bannerRef.current) return;
      const containerWidth = bannerRef.current.scrollWidth / 2;
      pos += speed / 60;
      if (pos >= containerWidth) pos = 0;
      bannerRef.current.style.transform = `translateX(-${pos}px)`;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3 sm:py-5 dark:from-[#13203a] dark:via-[#162748] dark:to-[#13203a]">
      <div className="flex whitespace-nowrap" ref={bannerRef}>
        {[...texts, ...texts].map((text, i) => (
          <span
            key={i}
            className={`mx-5 inline-block text-sm font-bold tracking-wider sm:mx-8 sm:text-lg md:text-xl ${
              i % 2 === 0 ? 'text-white' : 'text-blue-200 dark:text-slate-400'
            }`}
          >
            {text}
            <span className="mx-8 text-blue-300/50 dark:text-slate-600">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
