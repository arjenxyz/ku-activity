'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function HomeDataSecurity() {
  const strings = useRegistryStrings('components/home/HomeDataSecurity');

  return (
    <section className="veri-guvenligi-section bg-white py-14 sm:py-20" aria-labelledby="home-data-security-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-4xl rounded-2xl border-2 border-[#2D6AF6]/35 bg-[#f0f7ff] px-6 py-10 text-center sm:px-10 sm:py-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2
            id="home-data-security-title"
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {strings.title}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-pretty text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
            {strings.descriptionBefore}
            <strong className="font-semibold text-slate-800">{strings.descriptionHighlight}</strong>
            {strings.descriptionAfter}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
