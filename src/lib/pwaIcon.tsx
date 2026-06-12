import { ImageResponse } from 'next/og';

/** PWA / favicon — CrewLedger mark */
export function renderPwaIcon(size: number) {
  const pad = size * 0.14;
  const inner = size - pad * 2;
  const stroke = Math.max(2, size * 0.04);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          borderRadius: size * 0.21,
        }}
      >
        <svg
          width={inner}
          height={inner}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 4l10 6.5v13H6V10.5L16 4z"
            fill="rgba(255,255,255,0.2)"
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
      </div>
    ),
    { width: size, height: size }
  );
}
