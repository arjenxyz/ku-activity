'use client';

import { useState } from 'react';
import { FiDownload, FiShield } from 'react-icons/fi';
import { PERSONNEL_SELF_EXPORT_DAILY_LIMIT } from '@/lib/legal-dossier/types';

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

export function PersonnelMyDossierDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'İndirme başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/90 to-white dark:from-slate-800 dark:to-slate-900 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <FiShield className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Kayıtlarımı indir</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            KVKK m.11 kapsamında yevmiye, ödeme, sözleşme ve profil verilerinizin tam kopyasını ZIP
            olarak alın. Yöneticinizin gördüğü kayıtlarla aynı veri setidir — şeffaflık için.
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Günde en fazla {PERSONNEL_SELF_EXPORT_DAILY_LIMIT} kez indirebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Hazırlanıyor…
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                Kayıtlarımı indir (ZIP)
              </>
            )}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
