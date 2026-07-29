'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkyTwinkleStars } from '@/components/home/SkyTwinkleStars';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200/80 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
        aria-expanded={open}
      >
        <span className="text-base font-bold text-slate-900 sm:text-lg">{question}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition ${
            open ? 'rotate-180 bg-sky-100 text-[#2D6AF6]' : 'bg-transparent'
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-sm leading-relaxed text-slate-600 sm:pb-6 sm:text-base">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function HomeFaqSection() {
  const strings = useRegistryStrings('components/home/HomeFaqSection');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="ssss-section-yeni relative overflow-hidden bg-white py-14 sm:py-20" aria-labelledby="home-faq-title">
      <SkyTwinkleStars palette="blue" maskSolidEnd={72} maskFadeEnd={98} maxTopPercent={88} density={48} />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
        >
          <h2 id="home-faq-title" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {strings.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">{strings.description}</p>
        </motion.div>

        <div className="relative mt-10 rounded-2xl bg-white/80 px-4 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm sm:mt-12 sm:px-6">
          {strings.items.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() => setOpenIndex((prev) => (prev === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
