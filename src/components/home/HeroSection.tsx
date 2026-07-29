'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { DemoRoleButton } from '@/components/home/LoginRolePicker';
import { PhoneMockup } from '@/components/home/PhoneMockup';

export function HeroSection() {
  const strings = useRegistryStrings('components/home/HeroSection');
  const showcaseStrings = useRegistryStrings('components/home/HomeMobileShowcase');

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-[calc(var(--home-chrome-h,3.5rem)+0.75rem)] pb-10 sm:pb-14 sm:pt-[calc(var(--home-chrome-h,3.75rem)+1rem)] lg:pb-16 lg:pt-[calc(var(--home-chrome-h,4rem)+1.25rem)]"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
        <div className="absolute -top-28 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />
        <div
          className="absolute right-[-4rem] top-24 h-[28rem] w-[28rem] rounded-full bg-sky-100/45 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"
          aria-hidden
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 sm:gap-8 md:grid-cols-[minmax(0,1.1fr)_auto] md:gap-8 lg:gap-12 xl:gap-16">
          <motion.div
            className="px-1 pt-2 text-center sm:px-4 sm:pt-8 md:col-start-1 md:row-start-1 md:py-10 md:text-left lg:px-0"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 sm:mb-7">
              <span className="tracking-wide text-amber-400">★★★★☆</span>
              <span>{strings.badge}</span>
            </div>

            <h1 className="text-balance text-[2.15rem] font-bold tracking-tight text-[#2D6AF6] sm:text-5xl lg:text-[3.25rem] xl:text-6xl xl:leading-[1.05]">
              {strings.titlePrefix}
            </h1>
            <h2 className="mt-1.5 text-balance text-[2.15rem] font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-5xl lg:text-[3.25rem] xl:text-6xl xl:leading-[1.05]">
              {strings.titleHighlight}
            </h2>
          </motion.div>

          <motion.div
            className="relative flex justify-center md:col-start-2 md:row-start-1 md:row-span-2 md:justify-end md:self-center md:pr-2 lg:pr-0"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div
                className="pointer-events-none absolute -left-10 top-16 hidden h-40 w-40 rounded-3xl border border-sky-100/80 bg-white/50 shadow-sm backdrop-blur-sm md:block"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-6 bottom-20 hidden h-28 w-28 rounded-2xl border border-blue-100/70 bg-blue-50/60 md:block"
                aria-hidden
              />
              <PhoneMockup
                previewLabel={showcaseStrings.phonePreviewAlt}
                size="sm"
                float
                className="relative z-10 rotate-[1.5deg] md:rotate-[2deg]"
              />
            </div>
          </motion.div>

          <motion.div
            className="px-1 pb-6 text-center sm:px-4 sm:pb-8 md:col-start-1 md:row-start-2 md:pb-10 md:text-left lg:px-0"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.04 }}
          >
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-xl md:mx-0 lg:max-w-lg lg:text-xl">
              {strings.subtitle}
            </p>

            <div className="mt-8 flex justify-center md:justify-start">
              <DemoRoleButton pill>{strings.ctaDemo}</DemoRoleButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
