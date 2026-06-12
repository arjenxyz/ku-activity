'use client';

import { FiBookOpen, FiMail } from 'react-icons/fi';
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';
import { PersonnelFairnessCard } from './PersonnelFairnessCard';
import { PersonnelMyDossierDownload } from './PersonnelMyDossierDownload';
import type { WorkLog } from '@/lib/personnel-stats';

type Props = {
  workLogs: WorkLog[];
};

const KVKK_RIGHTS = [
  'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
  'İşlenmişse buna ilişkin bilgi talep etme',
  'Eksik veya yanlış işlenmişse düzeltilmesini isteme',
  'Silme veya yok edilmesini talep etme (mevzuat saklı)',
  'İşlenen verilerin aktarıldığı üçüncü kişileri bilme',
  'Otomatik sistemlerle aleyhinize sonuç doğuran işlemlere itiraz',
];

export function PersonnelRightsPanel({ workLogs }: Props) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;

  return (
    <div className="space-y-6">
      <PersonnelFairnessCard workLogs={workLogs} />

      <PersonnelMyDossierDownload />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <FiBookOpen className="w-4 h-4" />
          KVKK kapsamındaki haklarınız (m.11)
        </p>
        <ul className="mt-3 space-y-2">
          {KVKK_RIGHTS.map((right) => (
            <li key={right} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
              <span className="text-blue-600 shrink-0">•</span>
              {right}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500 flex items-start gap-2">
          <FiMail className="w-4 h-4 shrink-0 mt-0.5" />
          Başvuru ve itirazlar için yöneticinize veya{' '}
          <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
            {supportEmail}
          </a>{' '}
          adresine yazabilirsiniz.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        <strong className="text-slate-800 dark:text-slate-200">Şeffaflık ilkesi:</strong> Bu panelde
        gördüğünüz yevmiye, avans ve kesinti kayıtları yönetici paneliyle aynı veritabanından gelir.
        İndirdiğiniz ZIP dosyası da aynı kaynakların arşiv kopyasıdır — tek taraflı gizli kesinti veya
        gizlenmiş gün uygulanmaz.
      </div>
    </div>
  );
}
