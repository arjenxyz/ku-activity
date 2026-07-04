'use client';

import Link from 'next/link';
import { FiHeart, FiShield, FiEye, FiInfo } from 'react-icons/fi';
import { getVolunteerProjectSummary } from '@/lib/platform-legal-content';
import { getPlatformInfo } from '@/lib/platform-config';

export function VolunteerProjectSection() {
  const summary = getVolunteerProjectSummary();
  const platform = getPlatformInfo();

  return (
    <section id="proje-hakkinda" className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-4 py-1.5 text-sm font-medium">
            <FiHeart className="h-4 w-4" />
            {summary.title}
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Kişisel bir geliştirme projesi — şirket değil
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
            {summary.developerLine} {summary.noCompanyLine}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FiInfo className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Gönüllü kullanım</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary.optionalUseLine}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FiEye className="h-6 w-6 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Çift taraflı şeffaflık</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary.transparencyLine}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
            <FiShield className="h-6 w-6 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Resmiyet sınırı</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary.legalLine}</p>
          </div>
        </div>

        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 px-5 py-4 text-sm text-blue-950 dark:text-blue-100">
          <p>
            <strong>Geliştirici:</strong> {platform.developerName} ·{' '}
            <a href={`mailto:${platform.contactEmail}`} className="underline hover:no-underline">
              {platform.contactEmail}
            </a>
          </p>
          <p className="mt-2 text-blue-900/80 dark:text-blue-200/80">
            Detaylı metinler için{' '}
            <Link href="/kullanim-sartlari" className="font-semibold underline hover:no-underline">
              Kullanım Şartları
            </Link>
            ,{' '}
            <Link href="/kvkk" className="font-semibold underline hover:no-underline">
              KVKK
            </Link>{' '}
            ve{' '}
            <Link href="/gizlilik" className="font-semibold underline hover:no-underline">
              Gizlilik
            </Link>{' '}
            sayfalarını okuyun.
          </p>
        </div>
      </div>
    </section>
  );
}
