'use client';

import { motion } from 'framer-motion';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { HeroPlayStorePromo } from '@/components/home/HeroPlayStorePromo';
import { LoginRoleButton } from '@/components/home/LoginRolePicker';

export function HeroSection() {
  const strings = useRegistryStrings('components/home/HeroSection');

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-12 sm:pb-16 lg:pt-36 lg:pb-24"
    >
      <div className="absolute inset-0 -z-10">
        {/* Light */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:hidden" />
        {/* Dark — soft charcoal with quiet depth, no neon wash */}
        <div className="absolute inset-0 hidden dark:block bg-[#0b1220]" />
        <div
          className="absolute inset-0 hidden dark:block opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 80% -10%, rgba(59,130,246,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 10% 100%, rgba(14,21,72,0.45), transparent 50%), linear-gradient(180deg, #0b1220 0%, #0e1628 55%, #111827 100%)',
          }}
        />
        <div className="absolute top-0 right-0 h-[520px] w-[520px] -translate-y-1/3 translate-x-1/4 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/[0.07]" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] translate-y-1/3 -translate-x-1/4 rounded-full bg-indigo-400/10 blur-3xl dark:bg-slate-600/[0.12]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center lg:grid-cols-2 lg:gap-10 xl:gap-14">
          <motion.div
            className="max-w-3xl"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-1 dark:ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60 dark:bg-slate-400 dark:opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 dark:bg-slate-300" />
              </span>
              {strings.badge}
            </div>

            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-4xl md:text-5xl xl:text-6xl dark:text-[#f1f5f9]">
              {strings.titlePrefix}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-blue-200/90">
                {strings.titleHighlight}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-slate-300/90">
              {strings.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LoginRoleButton variant="hero" />
              <a
                href="#features"
                className="touch-target inline-flex w-full items-center justify-center rounded-xl border-2 border-gray-200 px-8 py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:w-auto dark:border-white/12 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
              >
                {strings.ctaExplore}
              </a>
            </div>
          </motion.div>

          <HeroPlayStorePromo />
        </div>
      </div>
    </section>
  );
}
