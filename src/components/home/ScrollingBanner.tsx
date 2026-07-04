'use client';

import { useEffect, useRef } from 'react';
import strings from '@json/src/components/home/ScrollingBanner.json';

const texts = strings.texts;

export function ScrollingBanner() {
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
    <div className="py-3 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 overflow-hidden">
      <div className="flex whitespace-nowrap" ref={bannerRef}>
        {[...texts, ...texts].map((text, i) => (
          <span
            key={i}
            className={`text-sm sm:text-lg md:text-xl font-bold inline-block mx-5 sm:mx-8 tracking-wider ${
              i % 2 === 0 ? 'text-white' : 'text-blue-200'
            }`}
          >
            {text}
            <span className="mx-8 text-blue-300/50">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
