'use client';

import { useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiDownload, FiFileText } from 'react-icons/fi';

type Props = {
  projectId: string;
  projectName?: string;
  className?: string;
  compact?: boolean;
};

function parseFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

export function ProjectLegalDossierDownloadButton({
  projectId,
  projectName,
  className = '',
  compact = false,
}: Props) {
  const strings = useRegistryStrings('components/admin/ProjectLegalDossierDownloadButton');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/legal-dossier`, {
        method: 'GET',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || strings.errors.downloadFailed);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parseFilename(
        res.headers.get('Content-Disposition'),
        strings.fallbackFilename
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.genericFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        title={projectName ? `${projectName} — ${strings.button}` : strings.button}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 ${
          compact ? 'w-full' : ''
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {strings.loading}
          </>
        ) : (
          <>
            <FiDownload className="w-4 h-4 shrink-0" />
            {strings.button}
          </>
        )}
      </button>
      {!compact && (
        <p className="mt-1.5 text-[11px] text-slate-500 flex items-start gap-1 max-w-md">
          <FiFileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {strings.hint}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
