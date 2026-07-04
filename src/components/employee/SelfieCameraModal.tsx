'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCamera, FiX } from 'react-icons/fi';

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onUseNativeCamera?: () => void;
};

export function SelfieCameraModal({ open, onClose, onCapture, onUseNativeCamera }: Props) {

  const strings = useRegistryStrings('components/employee/SelfieCameraModal');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setReady(false);
    stopStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(strings.browserUnsupported);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopStream();
        return;
      }

      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.srcObject = stream;
      await video.play();
      setReady(true);
    } catch (e) {
      stopStream();
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError(strings.permissionDenied);
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError(strings.notFound);
      } else {
        setError(strings.openFailed);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }

    document.body.style.overflow = 'hidden';
    void startStream();

    return () => {
      document.body.style.overflow = '';
      stopStream();
    };
  }, [open, startStream, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.9
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={strings.ariaLabel}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h3 className="text-base font-semibold">{strings.title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-3 -mr-2 rounded-full text-white/90 active:bg-white/10"
          aria-label={strings.close}
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${ready ? 'scale-x-[-1]' : ''}`}
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            {strings.opening}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-sm text-white">
            <p>{error}</p>
            {onUseNativeCamera && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUseNativeCamera();
                }}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
              >
                {strings.openNativeCamera}
              </button>
            )}
          </div>
        )}
        {ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[min(58vh,420px)] w-[min(72vw,300px)] rounded-[999px] border-2 border-white/45 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.25)]" />
          </div>
        )}
        {ready && (
          <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-white/80 px-4">
            {strings.faceHint}
          </p>
        )}
      </div>

      <div className="shrink-0 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 min-w-[5.5rem] rounded-full border border-white/30 px-5 text-sm font-medium text-white active:bg-white/10"
          >
            {strings.cancel}
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready}
            aria-label={strings.captureAriaLabel}
            className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white bg-white/15 text-white active:scale-95 disabled:opacity-40"
          >
            <FiCamera className="h-7 w-7" />
          </button>
          {onUseNativeCamera ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUseNativeCamera();
              }}
              className="min-h-12 min-w-[5.5rem] text-center text-xs font-medium text-white/80 underline-offset-2 active:text-white"
            >
              {strings.nativeCamera}
            </button>
          ) : (
            <div className="min-w-[5.5rem]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
