'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function RegistrationQrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="bg-slate-100 rounded-xl animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Admin onay QR kodu"
      width={size}
      height={size}
      className="rounded-xl border border-slate-200 bg-white p-2"
    />
  );
}
