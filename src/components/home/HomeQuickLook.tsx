'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HOME_DEMO_ASSETS } from '@/lib/home-demo-assets';

export function HomeQuickLook() {
  const strings = useRegistryStrings('components/home/HomeQuickLook');

  return (
    <section className="hizli-bakis-section bg-[#f3f8fc] py-12 sm:py-16" aria-labelledby="home-quick-look-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2
            id="home-quick-look-title"
            className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] lg:leading-tight"
          >
            {strings.title}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
            {strings.description}
          </p>
        </motion.div>

        <motion.div
          className="relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl shadow-blue-100/60 sm:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Image
            src={HOME_DEMO_ASSETS.dashboardPreview}
            alt={strings.previewAlt}
            width={1600}
            height={900}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 1024px, 100vw"
            priority={false}
          />
        </motion.div>
      </div>
    </section>
  );
}
