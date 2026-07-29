'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HeroPlayStorePromo } from '@/components/home/HeroPlayStorePromo';
import { DemoRoleButton, LoginRoleButton } from '@/components/home/LoginRolePicker';

export function HeroSection() {
  const strings = useRegistryStrings('components/home/HeroSection');
  return (
    <section id="hero" className="relative pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-12 sm:pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 lg:gap-10 xl:gap-14 items-center">
        <motion.div
          className="max-w-3xl"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            {strings.badge}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
            {strings.titlePrefix}{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {strings.titleHighlight}
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
            {strings.subtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <LoginRoleButton variant="hero" />
            <DemoRoleButton />
          </div>
        </motion.div>

        <HeroPlayStorePromo />
        </div>
      </div>
    </section>
  );
}
