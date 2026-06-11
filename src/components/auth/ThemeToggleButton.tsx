'use client';

import { useState, useEffect } from 'react';

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors ${className}`}
      aria-label="Tema değiştir"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-8.66l-.7.7M4.34 4.34l-.7.7M21 12h-1M4 12H3m16.66 4.66l-.7-.7M4.34 19.66l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      )}
    </button>
  );
}
