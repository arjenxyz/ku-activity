'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BrandMark } from '@/components/brand/BrandMark';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type Tone = 'sky' | 'amber' | 'emerald' | 'indigo' | 'slate' | 'rose' | 'violet' | 'cyan';

const TONE_STYLES: Record<Tone, string> = {
  sky: 'from-sky-100 to-sky-50 text-sky-700 ring-sky-200/80',
  amber: 'from-amber-100 to-amber-50 text-amber-700 ring-amber-200/80',
  emerald: 'from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200/80',
  indigo: 'from-indigo-100 to-indigo-50 text-indigo-700 ring-indigo-200/80',
  slate: 'from-slate-200 to-slate-100 text-slate-700 ring-slate-300/80',
  rose: 'from-rose-100 to-rose-50 text-rose-700 ring-rose-200/80',
  violet: 'from-violet-100 to-violet-50 text-violet-700 ring-violet-200/80',
  cyan: 'from-cyan-100 to-cyan-50 text-cyan-700 ring-cyan-200/80',
};

const MODULE_ICONS: ReactNode[] = [
  <path key="0" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  <path key="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V6m0 14v-2" />,
  <path key="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  <path key="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  <path key="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  <path key="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  <path key="6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  <path key="7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
];

/** Asimetrik elips yörüngesi — düz çizgili hub yerine eğri bağlantılar. */
const ORBIT_LAYOUT = [
  { x: 12, y: 28, curve: 'M50 50 C38 42, 22 34, 12 28', delay: 0 },
  { x: 28, y: 10, curve: 'M50 50 C42 38, 36 22, 28 10', delay: 0.08 },
  { x: 50, y: 6, curve: 'M50 50 C50 38, 50 22, 50 6', delay: 0.16 },
  { x: 72, y: 10, curve: 'M50 50 C58 38, 64 22, 72 10', delay: 0.24 },
  { x: 88, y: 28, curve: 'M50 50 C62 42, 78 34, 88 28', delay: 0.32 },
  { x: 88, y: 72, curve: 'M50 50 C62 58, 78 66, 88 72', delay: 0.4 },
  { x: 50, y: 94, curve: 'M50 50 C50 62, 50 78, 50 94', delay: 0.48 },
  { x: 12, y: 72, curve: 'M50 50 C38 58, 22 66, 12 72', delay: 0.56 },
] as const;

function OrbitPaths() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="orbit-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#2D6AF6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="38" ry="30" fill="none" stroke="#dbeafe" strokeWidth="0.35" strokeDasharray="2 2" />
      <ellipse cx="50" cy="50" rx="28" ry="22" fill="none" stroke="#e0f2fe" strokeWidth="0.25" />
      {ORBIT_LAYOUT.map((node, index) => (
        <path
          key={index}
          d={node.curve}
          fill="none"
          stroke="url(#orbit-line)"
          strokeWidth="0.45"
          strokeDasharray="1.5 1.2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function ModuleTile({
  label,
  tone,
  icon,
  x,
  y,
  delay,
}: {
  label: string;
  tone: Tone;
  icon: ReactNode;
  x: number;
  y: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      animate={{ y: [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.4, delay },
        scale: { duration: 0.4, delay },
        y: { duration: 4 + delay * 3, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 },
      }}
    >
      <div
        className={`flex w-[4.5rem] flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-b p-2.5 shadow-sm ring-1 sm:w-24 sm:gap-2 sm:p-3 ${TONE_STYLES[tone]}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm sm:h-10 sm:w-10">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            {icon}
          </svg>
        </div>
        <span className="text-center text-[10px] font-semibold leading-tight sm:text-xs">{label}</span>
      </div>
    </motion.div>
  );
}

export function HomePlatformConstellation() {
  const strings = useRegistryStrings('components/home/HomePlatformConstellation');

  return (
    <section className="platform-constellation-section overflow-hidden bg-white py-14 sm:py-20" aria-labelledby="platform-constellation-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2 id="platform-constellation-title" className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {strings.title}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">{strings.description}</p>
        </motion.div>

        <div className="evren-stage relative mx-auto mt-12 h-[min(72vw,320px)] max-w-3xl sm:mt-16 sm:h-[380px]">
          <div className="ekran-logo-wrapper relative h-full w-full">
            <OrbitPaths />

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute -inset-6 rounded-full bg-[#2D6AF6]/10 blur-2xl" aria-hidden />
                <div className="absolute -inset-3 rounded-full border border-dashed border-[#2D6AF6]/25" aria-hidden />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0E1548] to-[#2D6AF6] shadow-xl shadow-blue-500/25 ring-4 ring-white sm:h-28 sm:w-28">
                  <BrandMark size="lg" className="!h-16 !w-16 !rounded-2xl !shadow-none sm:!h-20 sm:!w-20" />
                </div>
              </motion.div>
            </div>

            {strings.modules.map((module, index) => {
              const layout = ORBIT_LAYOUT[index];
              if (!layout) return null;
              return (
                <ModuleTile
                  key={module.label}
                  label={module.label}
                  tone={module.tone as Tone}
                  icon={MODULE_ICONS[index]}
                  x={layout.x}
                  y={layout.y}
                  delay={layout.delay}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
