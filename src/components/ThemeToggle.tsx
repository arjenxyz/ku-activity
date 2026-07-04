'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import strings from '@json/src/components/ThemeToggle.json';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  // Hook'lar yukarıda kullanılmalı, koşullu render aşağıda yapılmalı
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  // Yönetim paneli ve giriş sayfalarında tema düğmesi gösterme
  if (
    pathname === '/' ||
    pathname.startsWith('/admin-panel') ||
    pathname.startsWith('/personnel-panel')
  ) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5 min-h-touch min-w-touch rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      aria-label={strings.ariaLabel}
      title={strings.title}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-8.66l-.7.7M4.34 4.34l-.7.7M21 12h-1M4 12H3m16.66 4.66l-.7-.7M4.34 19.66l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
        </svg>
      )}
    </button>
  );
}
