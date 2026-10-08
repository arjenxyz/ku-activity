const STARS = [
  { top: '12%', delay: '0s', duration: '22s', size: 16 },
  { top: '38%', delay: '-6s', duration: '28s', size: 12 },
  { top: '62%', delay: '-12s', duration: '18s', size: 18 },
  { top: '24%', delay: '-16s', duration: '32s', size: 10 },
  { top: '78%', delay: '-4s', duration: '26s', size: 14 },
  { top: '48%', delay: '-20s', duration: '20s', size: 11 },
  { top: '8%', delay: '-9s', duration: '30s', size: 13 },
];

export function SlidingStars() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-hidden sm:h-40" aria-hidden>
      {STARS.map((star) => (
        <span
          key={`${star.top}-${star.delay}`}
          className="home-slide-star absolute text-amber-400"
          style={{
            top: star.top,
            fontSize: star.size,
            ['--slide-duration' as string]: star.duration,
            ['--slide-delay' as string]: star.delay,
          }}
        >
          <span className="sky-twinkle-star inline-block">★</span>
        </span>
      ))}
    </div>
  );
}
