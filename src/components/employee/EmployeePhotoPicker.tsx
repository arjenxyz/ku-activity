'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiImage, FiTrash2 } from 'react-icons/fi';
import { EmployeeAvatar } from './EmployeeAvatar';
import { SelfieCameraModal } from './SelfieCameraModal';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

type Props = {
  name: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  /** selfie = ön kamera, personel kendi çeker */
  variant?: 'admin' | 'selfie';
};

export function EmployeePhotoPicker({
  name,
  value,
  onChange,
  required,
  variant = 'admin',
}: Props) {
  const isSelfie = variant === 'selfie';
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selfieOpen, setSelfieOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pickFile = (file: File | null) => {
    setError(null);
    if (!file) return;

    if (!ALLOWED.has(file.type)) {
      setError('JPEG, PNG, WebP veya GIF seçin');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Dosya en fazla 5 MB olabilir');
      return;
    }

    onChange(file);
  };

  const clear = () => {
    onChange(null);
    setError(null);
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  };

  const displayName = name.trim() || 'Personel';

  const openCamera = () => {
    if (isSelfie && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setSelfieOpen(true);
      return;
    }
    cameraRef.current?.click();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover bg-slate-200"
            />
          ) : (
            <EmployeeAvatar name={displayName} size="lg" className="!rounded-2xl !w-20 !h-20" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {isSelfie ? 'Kendi fotoğrafınız' : 'Personel fotoğrafı'}
            {required ? ' *' : ''}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSelfie
              ? 'Telefonunuzun ön kamerasıyla yüzünüzün net göründüğü bir selfie çekin.'
              : 'Her personel için ayrı fotoğraf çekin veya yükleyin. Bu fotoğraf personel panelinde de görünür.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openCamera}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900"
        >
          <FiCamera className="w-4 h-4" />
          {isSelfie ? 'Selfie Çek' : 'Fotoğraf Çek'}
        </button>
        {!isSelfie && (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
          >
            <FiImage className="w-4 h-4" />
            Galeriden Seç
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
          >
            <FiTrash2 className="w-4 h-4" />
            Kaldır
          </button>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={isSelfie ? 'user' : 'environment'}
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      {!isSelfie && (
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {required && !value && (
        <p className="text-xs text-amber-700">Kayıt için personel fotoğrafı zorunludur.</p>
      )}

      {isSelfie && (
        <SelfieCameraModal
          open={selfieOpen}
          onClose={() => setSelfieOpen(false)}
          onCapture={pickFile}
        />
      )}
    </div>
  );
}
