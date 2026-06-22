'use client';

import { useState } from 'react';
import {
  FiAlertCircle,
  FiBookOpen,
  FiChevronRight,
  FiDollarSign,
  FiDownload,
  FiMail,
  FiShield,
} from 'react-icons/fi';
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';
import { PERSONNEL_SELF_EXPORT_DAILY_LIMIT } from '@/lib/legal-dossier/types';
import { PersonnelContractsSection } from './PersonnelContractsSection';

const WAGE_RIGHTS = [
  {
    title: 'Yevmiye ve net hakediş',
    text: 'Günlük yevmiyenizi, çalışılan günleri ve ay sonu net tutarınızı Finans sekmesinden görebilirsiniz.',
  },
  {
    title: 'Avans ve kesintiler',
    text: 'Verilen avanslar ile yapılan kesintiler kayıt altındadır. Her kalemi ayrı ayrı inceleyebilirsiniz.',
  },
  {
    title: 'Asgari ücret',
    text: 'Asgari ücret tamamlama durumunuzu Asgari sekmesinden takip edebilirsiniz.',
  },
];

const WORK_RIGHTS = [
  {
    title: 'Yoklama ve yevmiye',
    text: 'Günlük yoklama QR ile alınır. Usta yoklamayı bitirdiğinde tam gün kaydınız otomatik oluşur.',
  },
  {
    title: 'Kayıtları görüntüleme',
    text: 'Yevmiye sekmesinde tüm çalışma günlerinizi ve mesai kayıtlarınızı görebilirsiniz.',
  },
];

const KVKK_RIGHTS = [
  'Verilerinizin işlenip işlenmediğini öğrenme',
  'İşlenmiş veriler hakkında bilgi talep etme',
  'Eksik veya yanlış verilerin düzeltilmesini isteme',
  'Verilerin silinmesini veya yok edilmesini talep etme (yasal saklama süreleri saklı)',
  'Verilerin aktarıldığı üçüncü kişileri bilme',
];

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

export function PersonnelRightsPanel() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch('/api/personnel/my-dossier');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'İndirilemedi');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parseFilename(res.headers.get('Content-Disposition'), 'crewledger-kayitlarim.zip');
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'İndirme başarısız');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 text-white shadow-lg shadow-blue-600/20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 45%)',
          }}
        />
        <div className="relative px-5 py-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <FiBookOpen className="w-5 h-5" />
          </span>
          <h2 className="mt-3 text-xl font-bold">Haklarınız</h2>
          <p className="mt-1.5 text-sm text-blue-100 leading-relaxed">
            İş kanunu ve KVKK kapsamındaki haklarınız. Sözleşmeleriniz ve kayıtlarınıza buradan
            ulaşın.
          </p>
        </div>
      </div>

      <RightsSection
        icon={<FiDollarSign className="w-4 h-4" />}
        title="Ücret ve ödeme"
        items={WAGE_RIGHTS}
      />

      <RightsSection
        icon={<FiAlertCircle className="w-4 h-4" />}
        title="Çalışma kayıtları"
        items={WORK_RIGHTS}
      />

      <PersonnelContractsSection />

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
          <span className="text-blue-600 dark:text-blue-400">
            <FiShield className="w-4 h-4" />
          </span>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Kişisel veri hakları (KVKK m.11)
          </p>
        </div>
        <ul className="px-4 py-3 space-y-2.5">
          {KVKK_RIGHTS.map((right) => (
            <li
              key={right}
              className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-snug"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              {right}
            </li>
          ))}
        </ul>
        <div className="px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Hazırlanıyor…
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                Verilerimi indir (ZIP)
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Günde en fazla {PERSONNEL_SELF_EXPORT_DAILY_LIMIT} kez
          </p>
          {downloadError && (
            <p className="text-xs text-red-600 text-center mt-2">{downloadError}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <a
          href={`mailto:${supportEmail}?subject=Hak%20talebi%20-%20CrewLedger`}
          className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <FiMail className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white">Hak talebi ve başvuru</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{supportEmail}</p>
          </div>
          <FiChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </a>
      </div>
    </div>
  );
}

function RightsSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { title: string; text: string }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </p>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700/80">
        {items.map((item) => (
          <li key={item.title} className="px-4 py-3.5">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
