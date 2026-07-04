'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import strings from '@json/src/components/registration/RegistrationQrCode.json';

export function RegistrationQrCode({
  value,
  size = 220,
  className = 'rounded-xl border border-slate-200 bg-white p-2',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
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
      alt={strings.alt}
      width={size}
      height={size}
      className={className}
    />
  );
}
