'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import type { HomeStats } from '@/hooks/useHomeStats';

type HeroSectionProps = {
  stats: HomeStats;
};

function getPerformanceLabel(uptime: number) {
  if (uptime >= 99.9) return '⭐ Olağanüstü';
  if (uptime >= 99.5) return 'Mükemmel';
  if (uptime >= 98.0) return 'İyi';
  return 'İzleniyor';
}

export function HeroSection({ stats }: HeroSectionProps) {
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
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          <motion.div
            className="lg:col-span-6"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              İnşaat sektörüne özel HR platformu
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.15]">
              Personel yönetimini{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                basitleştirin
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
              Yevmiye, avans, proje takibi ve maaş hesaplamaları tek platformda. Güvenli, hızlı ve
              kullanıcı dostu arayüz ile şantiye operasyonlarınızı dijitalleştirin.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/admin-panel/register"
                className="touch-target inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all w-full sm:w-auto"
              >
                Ücretsiz Kayıt Ol
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#features"
                className="touch-target inline-flex items-center justify-center border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                Özellikleri Keşfet
              </a>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Kurulum gerektirmez
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                7/24 erişim
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Türkçe destek
              </div>
            </div>
          </motion.div>

          <motion.div
            className="mt-14 lg:mt-0 lg:col-span-6"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-gray-400 ml-2">CrewLedger Dashboard</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Canlı</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {[
                    { label: 'Toplam Personel', value: stats.totalEmployees, icon: '👷', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
                    { label: 'Aktif Kullanıcı', value: stats.activeUsers, icon: '✓', color: 'bg-green-50 dark:bg-green-900/30 text-green-600' },
                    { label: 'Ort. İşlem Süresi', value: stats.processingTime, icon: '⚡', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600', suffix: 's', decimals: 1 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        <AnimatedCounter
                          value={item.value}
                          decimals={item.decimals}
                          suffix={item.suffix}
                        />
                      </span>
                    </div>
                  ))}

                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Sistem Durumu</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getPerformanceLabel(stats.uptime)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, stats.uptime)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-right text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      <AnimatedCounter value={stats.uptime} decimals={1} suffix="% Aktif" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
