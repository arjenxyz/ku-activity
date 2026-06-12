'use client';

import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiImage, FiTrash2 } from 'react-icons/fi';
import { EmployeeAvatar } from './EmployeeAvatar';
import { SelfieCameraModal } from './SelfieCameraModal';
import { prefersNativeCamera } from '@/lib/device-camera';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

type Props = {
  name: string;
  value: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  /** selfie = ön kamera, personel kendi çeker */
  variant?: 'admin' | 'selfie';
  /** Dar sütun / başvuru paneli için dikey düzen */
  layout?: 'default' | 'stacked';
};

export function EmployeePhotoPicker({
  name,
  value,
  onChange,
  required,
  variant = 'admin',
  layout = 'default',
}: Props) {
  const isStacked = layout === 'stacked';
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

    const type = file.type || 'image/jpeg';
    if (!ALLOWED.has(type) && !type.startsWith('image/')) {
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

  const openNativeCamera = () => {
    cameraRef.current?.click();
  };

  const openCamera = () => {
    if (isSelfie && prefersNativeCamera()) {
      openNativeCamera();
      return;
    }
    if (isSelfie && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setSelfieOpen(true);
      return;
    }
    openNativeCamera();
  };

  const displayName = name.trim() || 'Personel';

  const photoClass = isStacked
    ? 'h-32 w-32'
    : 'h-28 w-28 sm:h-20 sm:w-20';

  return (
    <div
      className={
        isStacked
          ? 'space-y-4'
          : 'rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4'
      }
    >
      <div
        className={
          isStacked
            ? 'flex flex-col items-center gap-3 text-center'
            : 'flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4'
        }
      >
        <div className="relative shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={displayName}
              className={`${photoClass} rounded-2xl object-cover bg-slate-200`}
            />
          ) : (
            <EmployeeAvatar
              name={displayName}
              size="lg"
              className={
                isStacked
                  ? '!rounded-2xl !h-32 !w-32'
                  : '!rounded-2xl !h-28 !w-28 sm:!h-20 sm:!w-20'
              }
            />
          )}
        </div>
        <div className={`min-w-0 flex-1 ${isStacked ? 'text-center' : 'text-center sm:text-left'}`}>
          <p className="text-sm font-semibold text-slate-900">
            {isSelfie ? 'Kendi fotoğrafınız' : 'Personel fotoğrafı'}
            {required ? ' *' : ''}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isSelfie
              ? 'Ön kamerayla yüzünüzün net göründüğü bir selfie çekin. Mobilde doğrudan telefon kamerası açılır.'
              : 'Her personel için ayrı fotoğraf çekin veya yükleyin. Bu fotoğraf personel panelinde de görünür.'}
          </p>
        </div>
      </div>

      <div
        className={
          isStacked ? 'flex flex-col gap-2' : 'flex flex-col gap-2 sm:flex-row sm:flex-wrap'
        }
      >
        <button
          type="button"
          onClick={openCamera}
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white active:bg-slate-900 ${
            isStacked ? '' : 'sm:w-auto sm:min-h-0 sm:rounded-lg sm:py-2'
          }`}
        >
          <FiCamera className="h-5 w-5 shrink-0" />
          {isSelfie ? 'Selfie Çek' : 'Fotoğraf Çek'}
        </button>
        {isSelfie && (
          <button
            type="button"
            onClick={openNativeCamera}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 ${
              isStacked ? '' : 'sm:w-auto sm:min-h-0 sm:rounded-lg sm:py-2'
            }`}
          >
            <FiImage className="h-5 w-5 shrink-0" />
            Galeriden seç
          </button>
        )}
        {!isSelfie && (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 ${
              isStacked ? '' : 'sm:w-auto sm:min-h-0 sm:rounded-lg sm:py-2'
            }`}
          >
            <FiImage className="h-5 w-5 shrink-0" />
            Galeriden Seç
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={clear}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 active:bg-red-50 ${
              isStacked ? '' : 'sm:w-auto sm:min-h-0 sm:rounded-lg sm:py-2'
            }`}
          >
            <FiTrash2 className="h-5 w-5 shrink-0" />
            Kaldır
          </button>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={isSelfie ? 'user' : 'environment'}
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      {!isSelfie && (
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      )}
      {isSelfie && (
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
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
          onUseNativeCamera={openNativeCamera}
        />
      )}
    </div>
  );
}
