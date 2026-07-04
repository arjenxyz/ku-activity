'use client';

import { useEffect, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
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
  variant?: 'admin' | 'selfie';
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

  const strings = useRegistryStrings('components/employee/EmployeePhotoPicker');
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
      setError(strings.invalidFormat);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(strings.maxSize);
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

  const displayName = name.trim() || strings.defaultName;

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
            {isSelfie ? strings.selfieTitle : strings.adminTitle}
            {required ? ' *' : ''}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isSelfie ? strings.selfieHint : strings.adminHint}
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
          {isSelfie ? strings.takeSelfie : strings.takePhoto}
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
            {strings.pickFromGallery}
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
            {strings.pickFromGalleryCapital}
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
            {strings.remove}
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
        <p className="text-xs text-amber-700">{strings.requiredHint}</p>
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
