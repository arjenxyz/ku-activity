'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

/** Telefon hero’da; burada yalnızca metin kalır (çift telefon yok). */
export function HomeMobileShowcase() {
  const strings = useRegistryStrings('components/home/HomeMobileShowcase');

  return (
    <section
      className="hem-mobil-hem-web-section bg-[#f3f8fc] py-12 sm:py-16"
      aria-labelledby="home-mobile-showcase-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2
            id="home-mobile-showcase-title"
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {strings.title}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
            {strings.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
