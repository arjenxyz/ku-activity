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
    <div className="overflow-hidden bg-gradient-to-r from-[#0E1548] via-[#152D7A] to-[#2D6AF6] py-3 sm:py-5">
      <div className="flex whitespace-nowrap" ref={bannerRef}>
        {[...texts, ...texts].map((text, i) => (
          <span
            key={i}
            className={`mx-5 inline-block text-sm font-bold tracking-wider sm:mx-8 sm:text-lg md:text-xl ${
              i % 2 === 0 ? 'text-white' : 'text-[#BFD7FF]'
            }`}
          >
            {text}
            <span className="mx-8 text-[#7FAEFF]/60">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
