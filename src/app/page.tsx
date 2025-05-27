'use client'; // Next.js 13+ ise client component olarak tanımla

import { useState, useEffect } from 'react';

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  // Sayfa yüklendiğinde localStorage'dan temayı al ve uygula
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Tema Toggle Butonu */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        aria-label="Toggle Dark Mode"
        title="Tema Değiştir"
      >
        {isDark ? (
          // Güneş ikonu (açık mod için)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-8.66l-.7.7M4.34 4.34l-.7.7M21 12h-1M4 12H3m16.66 4.66l-.7-.7M4.34 19.66l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Ay ikonu (karanlık mod için)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="none">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          </svg>
        )}
      </button>

      {/* Hero Section */}
      <section className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 text-white px-6 md:px-20 py-28 flex flex-col md:flex-row items-center justify-between overflow-hidden transition-colors duration-500">
        <div className="max-w-2xl space-y-6 z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-50 to-blue-100 bg-clip-text text-transparent">
            Modern Personel Yönetimi <br />
            <span className="text-indigo-200">ArjenDev</span> ile <br />
            Artık Çok Daha Kolay
          </h1>
          <p className="text-lg text-indigo-200/90 max-w-xl">
            Maaş hesaplamaları, çalışma takibi ve raporlamalar tek platformda. 
            Zamandan tasarruf edin, verimliliği artırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <a
              href="/admin-panel/"
              className="bg-white/90 text-indigo-900 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H3a1 1 0 100 2h7.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Yönetici Girişi
            </a>
            <a
              href="/personnel-panel"
              className="border-2 border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/10 hover:border-white/40 transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
              </svg>
              Personel Girişi
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
