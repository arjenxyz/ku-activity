'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PersonnelPanelPhonePreview } from '@/components/home/PersonnelPanelPhonePreview';

type PhoneMockupProps = {
  previewLabel: string;
  className?: string;
  size?: 'sm' | 'md';
  float?: boolean;
};

export function PhoneMockup({
  previewLabel,
  className = '',
  size = 'md',
  float = false,
}: PhoneMockupProps) {
  const [darkChrome, setDarkChrome] = useState(false);
  const widthClass =
    size === 'sm'
      ? 'w-[min(52vw,175px)] sm:w-[240px] lg:w-[250px] xl:w-[270px]'
      : 'w-[min(72vw,260px)] sm:w-[280px]';

  const chromeBg = darkChrome ? 'bg-black' : 'bg-slate-50';
  const notchBg = darkChrome ? 'bg-black' : 'bg-slate-900';

  const frame = (
    <div className={`relative mx-auto ${widthClass} ${className}`} aria-label={previewLabel}>
      <div
        className="absolute -bottom-4 left-1/2 -z-10 h-8 w-[70%] -translate-x-1/2 rounded-[100%] bg-slate-900/20 blur-xl"
        aria-hidden
      />

      <div className="overflow-hidden rounded-[2.4rem] border-[10px] border-slate-900 bg-slate-900 shadow-[0_28px_60px_-18px_rgba(15,23,42,0.55)]">
        <div className={`relative overflow-hidden rounded-[1.75rem] ${chromeBg}`}>
          <div className={`flex h-6 items-end justify-center pb-0.5 ${chromeBg}`}>
            <div className={`h-3.5 w-20 rounded-b-2xl ${notchBg}`} aria-hidden />
          </div>

          <div className={`relative aspect-[9/16] w-full overflow-hidden ${chromeBg}`}>
            <PersonnelPanelPhonePreview onImmersiveChange={setDarkChrome} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!float) return frame;

  return (
    <motion.div
      className="will-change-transform"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {frame}
    </motion.div>
  );
}
