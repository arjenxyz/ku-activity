'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    step: '01',
    title: 'Hesap Oluşturun',
    description: 'Yönetici panelinden şirketinizi kaydedin ve projelerinizi tanımlayın.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
  },
  {
    step: '02',
    title: 'Personeli Ekleyin',
    description: 'Çalışanlarınızı projelere atayın, yevmiye ve avans ayarlarını yapılandırın.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
  },
  {
    step: '03',
    title: 'Takip Edin & Raporlayın',
    description: 'Gerçek zamanlı verilerle şantiye performansını izleyin, raporlarınızı anında alın.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Nasıl Çalışır
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            3 adımda dijital dönüşüm
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Dakikalar içinde kurulum yapın, hemen kullanmaya başlayın.
          </p>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200 dark:from-blue-800 dark:via-indigo-700 dark:to-blue-800" />

          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative text-center"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 border-2 border-blue-100 dark:border-slate-700">
                  {item.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
