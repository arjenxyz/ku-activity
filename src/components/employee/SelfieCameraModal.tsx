'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function SelfieCameraModal({ open, onClose, onCapture }: Props) {
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
      setError('Tarayıcınız kamera erişimini desteklemiyor.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopStream();
        return;
      }

      video.srcObject = stream;
      await video.play();
      setReady(true);
    } catch (e) {
      stopStream();
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Kamera izni verilmedi. Tarayıcı ayarlarından izin verin.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('Kamera bulunamadı.');
      } else {
        setError('Kamera açılamadı. Lütfen tekrar deneyin.');
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (open) {
      void startStream();
    } else {
      stopStream();
      setError(null);
    }
  }, [open, startStream, stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

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
      0.92
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Selfie kamerası"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Selfie çek</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[3/4] sm:aspect-[4/3]">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${ready ? 'scale-x-[-1]' : ''}`}
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
              Kamera açılıyor…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
          >
            <FiCamera className="w-4 h-4" />
            Fotoğrafı al
          </button>
        </div>
      </div>
    </div>
  );
}
