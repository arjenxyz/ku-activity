'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export function HomeWhySection() {
  const strings = useRegistryStrings('components/home/HomeWhySection');

  return (
    <section className="neden-crewledger-section bg-slate-50/80 py-14 sm:py-20" aria-labelledby="home-why-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2
            id="home-why-title"
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight"
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
