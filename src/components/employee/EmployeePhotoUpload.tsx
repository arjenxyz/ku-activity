'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiTrash2, FiUpload } from 'react-icons/fi';
import { EmployeeAvatar } from './EmployeeAvatar';
import { deleteEmployeePhoto, uploadEmployeePhoto } from '@/lib/project-api';

type Props = {
  projectId: string;
  employeeId: string;
  name: string;
  photoUrl?: string | null;
  onChange?: (photoUrl: string | null) => void;
  compact?: boolean;
};

export function EmployeePhotoUpload({
  projectId,
  employeeId,
  name,
  photoUrl,
  onChange,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(photoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUrl(photoUrl ?? null);
  }, [photoUrl]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const url = await uploadEmployeePhoto(projectId, employeeId, file);
      const bust = `${url}?t=${Date.now()}`;
      setCurrentUrl(bust);
      onChange?.(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    if (!confirm('Fotoğrafı kaldırmak istediğinize emin misiniz?')) return;
    setError(null);
    setLoading(true);
    try {
      await deleteEmployeePhoto(projectId, employeeId);
      setCurrentUrl(null);
      onChange?.(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-3' : 'space-y-3'}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          title="Fotoğraf yükle"
        >
          <EmployeeAvatar name={name} photoUrl={currentUrl} size={compact ? 'sm' : 'lg'} />
          <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <FiCamera className="w-5 h-5 text-white" />
          </span>
        </button>

        {!compact && (
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">JPEG, PNG, WebP · max 5 MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiUpload className="w-3.5 h-3.5" />
            {loading ? 'Yükleniyor…' : currentUrl ? 'Değiştir' : 'Yükle'}
          </button>
          {currentUrl && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Kaldır
            </button>
          )}
        </div>
      )}

      {compact && loading && <p className="text-[10px] text-slate-500">…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
