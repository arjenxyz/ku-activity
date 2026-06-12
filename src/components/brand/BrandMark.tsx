type Props = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClass = {
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
} as const;

export function BrandMark({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizeClass[size]} bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0 ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 22h20M8 18h16M10 14h12M12 10h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 6l6 4v12H10V10l6-4z"
          stroke="white"
          strokeWidth="1.75"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.15)"
        />
      </svg>
    </div>
  );
}
