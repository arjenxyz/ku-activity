'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeFooter } from '@/components/home/HomeFooter';
import { GooglePlayBadge } from '@/components/home/GooglePlayBadge';
import {
  APP_RELEASE_ICONS,
  APP_RELEASE_LABELS,
  APP_RELEASE_TYPES,
  formatApkFileSize,
  type AppReleaseType,
} from '@/lib/app-releases';
import {
  PLAY_STORE_ADMIN_URL,
  PLAY_STORE_PERSONNEL_URL,
} from '@/lib/play-store';

type PublicRelease = {
  appType: AppReleaseType;
  id: string | null;
  versionName?: string;
  versionCode?: number;
  fileSize?: number;
  sha256?: string | null;
  releaseNotes?: string | null;
  publishedAt?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(value));
}

export default function ApkDownloadPage() {
  const [releases, setReleases] = useState<PublicRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/releases')
      .then((res) => res.json())
      .then((data) => setReleases(data.releases ?? []))
      .finally(() => setLoading(false));
  }, []);

  const playUrls: Record<AppReleaseType, string> = {
    personnel: PLAY_STORE_PERSONNEL_URL,
    admin: PLAY_STORE_ADMIN_URL,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HomeHeader />
      <main className="pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Alternatif indirme</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              APK ile indirin
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Google Play kullanamıyorsanız imzalı APK dosyasını doğrudan indirebilirsiniz. Mümkünse Play Store
              üzerinden kurulum önerilir; güncellemeler otomatik gelir.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {APP_RELEASE_TYPES.map((appType, index) => {
              const meta = APP_RELEASE_LABELS[appType];
              const release = releases.find((row) => row.appType === appType);
              const hasApk = Boolean(release?.id);
              const playUrl = playUrls[appType];

              return (
                <motion.article
                  key={appType}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700">
                      <Image
                        src={APP_RELEASE_ICONS[appType]}
                        alt=""
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Android · APK</p>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{meta.title}</h2>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{meta.description}</p>

                  <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 flex-1">
                    {loading ? (
                      <p className="text-sm text-slate-500">Sürüm bilgisi yükleniyor…</p>
                    ) : hasApk ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Sürüm {release?.versionName}{' '}
                          <span className="text-slate-400 font-normal">(kod {release?.versionCode})</span>
                        </p>
                        {release?.publishedAt && (
                          <p className="text-xs text-slate-500">Yayın: {formatDate(release.publishedAt)}</p>
                        )}
                        {release?.fileSize ? (
                          <p className="text-xs text-slate-500">Boyut: {formatApkFileSize(release.fileSize)}</p>
                        ) : null}
                        {release?.releaseNotes ? (
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap mt-3 leading-relaxed">
                            {release.releaseNotes}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Henüz yayınlanmış APK sürümü yok.</p>
                    )}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    {hasApk ? (
                      <a
                        href={`/api/public/releases/${appType}/download`}
                        className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
                      >
                        APK İndir
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </a>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 text-center text-sm text-slate-500">
                        APK yakında
                      </div>
                    )}
                    <GooglePlayBadge href={playUrl} enabled={Boolean(playUrl)} fullWidth />
                  </div>
                </motion.article>
              );
            })}
          </div>

          <section className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">APK kurulum notu</h2>
            <ol className="mt-3 space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80 list-decimal list-inside leading-relaxed">
              <li>İndirilen dosyayı açın ve kuruluma izin verin.</li>
              <li>Android “Bilinmeyen kaynak” uyarısı çıkarsa Ayarlar’dan bu tarayıcıya izin verin.</li>
              <li>Kurulumdan sonra uygulamayı normal şekilde açabilirsiniz.</li>
              <li>Güncellemeler için bu sayfayı veya Play Store’u kontrol edin.</li>
            </ol>
          </section>

          <p className="mt-8 text-center text-sm text-slate-500">
            <Link href="/#play-store" className="text-blue-600 hover:underline dark:text-blue-400">
              Ana sayfadaki mobil bölüme dön
            </Link>
          </p>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
