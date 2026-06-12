'use client';

import { useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';

type Props = {
  projectId: string;
  employeeId: string;
  employeeName: string;
  variant?: 'primary' | 'secondary';
  className?: string;
};

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

export function LegalDossierDownloadButton({
  projectId,
  employeeId,
  employeeName,
  variant = 'secondary',
  className = '',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/employees/${employeeId}/legal-dossier`,
        { method: 'GET' }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Dosya indirilemedi');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parseFilename(
        res.headers.get('Content-Disposition'),
        `crewledger-hukuki-dosya.zip`
      );
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

  const baseClass =
    variant === 'primary'
      ? 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50'
      : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50';

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        title={`${employeeName} için hukuki personel dosyası (ZIP)`}
        className={baseClass}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Hazırlanıyor…
          </>
        ) : (
          <>
            <FiDownload className="w-4 h-4 shrink-0" />
            Hukuki dosya indir
          </>
        )}
      </button>
      <p className="mt-1.5 text-[11px] text-slate-500 flex items-start gap-1 max-w-xs">
        <FiFileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Profil, hassas veriler, yevmiye, ödemeler, sözleşmeler ve başvuru geçmişi tek ZIP.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
