import { ImageResponse } from 'next/og';

export function renderPwaIcon(size: number) {
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
          borderRadius: size * 0.18,
        }}
      >
        <span
          style={{
            fontSize: size * 0.45,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          A
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}
