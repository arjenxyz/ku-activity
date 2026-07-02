'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_BADGE_TR,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';

const apps = [
  {
    id: 'personel',
    title: 'Personel Uygulaması',
    description: 'Yoklama, yevmiye, mesai ve bordro görüntüleme. Başvuru ve günlük işlemler için.',
    playUrl: PLAY_STORE_PERSONNEL_URL,
    webFallback: '/personnel-panel/basvuru',
    accent: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'admin',
    title: 'Yönetici Uygulaması',
    description: 'Proje yönetimi, personel onayı, yevmiye ve raporlar. Şantiye operasyonu tek elden.',
    playUrl: PLAY_STORE_ADMIN_URL,
    webFallback: '/admin-panel/login',
    accent: 'from-slate-800 to-slate-950',
  },
] as const;

function GooglePlayBadge({ href, enabled }: { href: string; enabled: boolean }) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        Google Play&apos;de yakında
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
      aria-label="Google Play'den indir"
    >
      <Image
        src={PLAY_STORE_BADGE_TR}
        alt="Google Play'den edinin"
        width={180}
        height={53}
        className="h-[52px] w-auto"
        unoptimized
      />
    </a>
  );
}

export function PlayStoreSection() {
  return (
    <section id="play-store" className="py-20 lg:py-28 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Mobil Uygulama
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Google Play&apos;den indirin
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Personel ve yönetici için ayrı uygulamalar. Kurulum gerektirmez; telefonunuzdan hemen
            kullanmaya başlayın.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {apps.map((app, i) => {
            const hasPlayLink = Boolean(app.playUrl);
            return (
              <motion.div
                key={app.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-6 sm:p-8 flex flex-col"
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-gradient-to-br ${app.accent} text-white shadow-lg mb-5`}
                >
                  <BrandMark size="sm" className="ring-2 ring-white/20" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{app.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                  {app.description}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <GooglePlayBadge href={app.playUrl} enabled={hasPlayLink} />
                  {!hasPlayLink && (
                    <Link
                      href={app.webFallback}
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Web sürümünü aç →
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Mağaza bağlantıları yayınlandığında burada görünür. Şimdilik tarayıcıdan da aynı
          panellere erişebilirsiniz.
        </p>
      </div>
    </section>
  );
}
