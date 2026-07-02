import { ImageResponse } from 'next/og';
import {
  PERSONNEL_PWA_GRADIENT,
  PERSONNEL_PWA_SPLASH_BG,
} from '@/lib/personnel-pwa-brand';

export type PwaIconVariant = 'personnel' | 'admin';

const GRADIENTS: Record<PwaIconVariant, string> = {
  personnel: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)',
  admin: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
};

function BrandSvg({ size, stroke }: { size: number; stroke: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 4l10 6.5v13H6V10.5L16 4z"
        fill="rgba(255,255,255,0.22)"
        stroke="white"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path
        d="M7 26h18M9 21h14M11 16h10M13 11h6"
        stroke="white"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** PWA / favicon — CrewLedger mark */
export function renderPwaIcon(size: number, variant: PwaIconVariant = 'personnel') {
  const pad = size * 0.14;
  const inner = size - pad * 2;
  const stroke = Math.max(2, size * 0.04);
  const radius = variant === 'personnel' ? size * 0.22 : size * 0.21;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: GRADIENTS[variant],
          borderRadius: radius,
        }}
      >
        <BrandSvg size={inner} stroke={stroke} />
      </div>
    ),
    { width: size, height: size }
  );
}

/** Android maskable splash — tam gökyüzü zemin, logo güvenli alanda */
export function renderPwaMaskableIcon(size: number) {
  const logo = size * 0.38;
  const stroke = Math.max(2, size * 0.035);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: PERSONNEL_PWA_GRADIENT,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: logo * 1.35,
            height: logo * 1.35,
            borderRadius: logo * 0.28,
            background: 'rgba(255,255,255,0.14)',
            border: `${Math.max(2, size * 0.006)}px solid rgba(255,255,255,0.28)`,
          }}
        >
          <BrandSvg size={logo} stroke={stroke} />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}

/** iOS / tam ekran PWA açılış görseli */
export function renderPwaSplashScreen(width: number, height: number) {
  const logo = Math.min(width, height) * 0.18;
  const stroke = Math.max(2, logo * 0.05);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: PERSONNEL_PWA_GRADIENT,
          padding: `${height * 0.1}px ${width * 0.08}px ${height * 0.12}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: Math.max(11, width * 0.028),
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.78)',
            textTransform: 'uppercase',
          }}
        >
          CrewLedger Personel
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: height * 0.028,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: logo * 1.4,
              height: logo * 1.4,
              borderRadius: logo * 0.3,
              background: 'rgba(255,255,255,0.16)',
              border: '3px solid rgba(255,255,255,0.28)',
            }}
          >
            <BrandSvg size={logo} stroke={stroke} />
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: Math.max(22, width * 0.058),
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.15,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              maxWidth: width * 0.82,
            }}
          >
            Şantiyede güvenle ilerle
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {['Yoklama', 'Yevmiye', 'Bordro'].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  fontSize: Math.max(9, width * 0.024),
                  fontWeight: 700,
                  color: '#78350f',
                  background: 'rgba(251,191,36,0.92)',
                  border: '1px solid rgba(254,243,199,0.55)',
                  borderRadius: 999,
                  padding: `${height * 0.008}px ${width * 0.028}px`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: height * 0.012,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: Math.max(13, width * 0.034),
              fontWeight: 800,
              color: 'white',
              letterSpacing: '0.14em',
            }}
          >
            CREWLEDGER
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}

export { PERSONNEL_PWA_SPLASH_BG };
