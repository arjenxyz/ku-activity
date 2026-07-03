'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Yevmiye Yönetimi',
    description: 'Günlük çalışma kayıtları, mesai hesaplamaları ve proje bazlı yevmiye takibi ile şantiye operasyonlarını kolaylaştırın.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    title: 'Avans Takibi',
    description: 'Personel avans talepleri, onay süreçleri ve kesinti hesaplamalarını tek ekrandan yönetin.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    title: 'Proje Yönetimi',
    description: 'Çoklu proje desteği ile her şantiyenin personel, maliyet ve ilerleme verilerini ayrı ayrı takip edin.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    title: 'Detaylı Raporlama',
    description: 'Özelleştirilebilir raporlar ve analitik araçlarla iş gücü verilerinizi anlamlı içgörülere dönüştürün.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    title: 'Güvenli Veri Saklama',
    description: 'Şifrelenmiş veri depolama ve rol tabanlı erişim kontrolleriyle hassas bilgilerinizi koruyun.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
    color: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    title: 'Personel Paneli',
    description: 'Çalışanlar kendi yevmiye kayıtlarını, avans durumlarını ve çalışma geçmişlerini görüntüleyebilir.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
];

export function FeaturesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 lg:py-28 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Özellikler
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            İnşaat sektörü için kapsamlı çözümler
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Şantiye yönetiminden bordro hesaplamalarına kadar tüm personel süreçleriniz tek platformda.
            Ekip büyüdükçe yönetim karmaşası değil verimlilik artsın.
          </p>
        </motion.div>

        <div className="mt-16 hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 md:hidden space-y-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
            >
              <button
                className={`w-full flex items-center justify-between p-4 ${feature.bg}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm text-left">{feature.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
