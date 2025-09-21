'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Environment değişkenlerini kontrol et
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase client oluştur
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    uptime: 0,
    totalEmployees: 0,
    processingTime: 0.3
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const speed = 150; // piksel/saniye

  useEffect(() => {
    // Gerçek verileri çek
    const fetchRealStats = async () => {
      try {
        // Aktif kullanıcı sayısını çek (son 15 dakika içinde giriş yapanlar)
        const { data: activeUsersData, error: activeUsersError } = await supabase
          .from('users')
          .select('id')
          .eq('is_active', true)
          .gte('last_login', new Date(Date.now() - 15 * 60 * 1000).toISOString());
        
        // Toplam personel sayısını çek
        const { count: employeesCount, error: employeesError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'personnel');
        
        // Sistem uptime verisini çek (son 24 saat)
        const { data: uptimeData, error: uptimeError } = await supabase
          .from('system_uptime')
          .select('status')
          .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        // Ortalama işlem süresini çek (son 1 saat)
        const { data: processingData, error: processingError } = await supabase
          .from('payroll_processing')
          .select('processing_time')
          .eq('status', 'success')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
        
        if (!activeUsersError && activeUsersData) {
          setStats(prev => ({ ...prev, activeUsers: activeUsersData.length }));
        }
        
        if (!employeesError) {
          setStats(prev => ({ ...prev, totalEmployees: employeesCount || 0 }));
        }
        
        if (!uptimeError && uptimeData) {
          const upCount = uptimeData.filter(record => record.status === 'up').length;
          const uptimePercentage = uptimeData.length > 0 ? (upCount / uptimeData.length) * 100 : 99.9;
          setStats(prev => ({ ...prev, uptime: parseFloat(uptimePercentage.toFixed(1)) }));
        }
        
        if (!processingError && processingData && processingData.length > 0) {
          const totalTime = processingData.reduce((sum: number, record: { processing_time: number }) => sum + record.processing_time, 0);
          const avgTime = totalTime / processingData.length;
          setStats(prev => ({ ...prev, processingTime: parseFloat(avgTime.toFixed(1)) }));
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      }
    };

    // İlk verileri çek
    fetchRealStats();

    // Gerçek zamanlı abonelikler
    const userSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => {
          // Kullanıcı tablosunda değişiklik olduğunda istatistikleri yenile
          fetchRealStats();
        }
      )
      .subscribe();

    const uptimeSubscription = supabase
      .channel('uptime-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_uptime' },
        () => {
          // Sistem durumu değiştiğinde uptime'ı yenile
          supabase
            .from('system_uptime')
            .select('status')
            .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                const upCount = data.filter(record => record.status === 'up').length;
                const uptimePercentage = (upCount / data.length) * 100;
                setStats(prev => ({ ...prev, uptime: parseFloat(uptimePercentage.toFixed(1)) }));
              }
            });
        }
      )
      .subscribe();

    const processingSubscription = supabase
      .channel('processing-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payroll_processing' },
        () => {
          // İşlem süreleri değiştiğinde güncelle
          supabase
            .from('payroll_processing')
            .select('processing_time')
            .eq('status', 'success')
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                const totalTime = data.reduce((sum: number, record: { processing_time: number }) => sum + record.processing_time, 0);
                const avgTime = totalTime / data.length;
                setStats(prev => ({ ...prev, processingTime: parseFloat(avgTime.toFixed(1)) }));
              }
            });
        }
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      uptimeSubscription.unsubscribe();
      processingSubscription.unsubscribe();
    };
  }, []);

  // Banner animation
  useEffect(() => {
    let pos = 0;
    let animationFrame: number;

    const animate = () => {
      if (!bannerRef.current) return;
      const containerWidth = bannerRef.current.scrollWidth / 2; // Çünkü metinleri iki kez kopyaladık
      pos += speed / 60; // 60 FPS varsayımı
      if (pos >= containerWidth) pos = 0;
      bannerRef.current.style.transform = `translateX(-${pos}px)`;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const texts = [
    'ARJEN DEVELOPER',
    'HR MANAGEMENT PLATFORM',
    'EFFORTLESS HR ADMINISTRATION',
    'DIGITAL HR SOLUTIONS',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Şeffaf yapıldı */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ArjenDev</h1>
                <p className="text-xs text-gray-500">HR Management</p>
              </div>
            </div>
            
            {/* Masaüstü Navigasyon */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Anasayfa</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Özellikler</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Destek</a>
            </nav>
            
            {/* Mobil Menü Butonu */}
            <button 
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 py-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className={`bg-blue-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-blue-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-1 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-blue-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </button>
          </div>
          
          {/* Mobil Menü - Açılır kapanır */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <nav className="pb-4 space-y-3">
              <a href="#" className="block text-gray-600 hover:text-gray-900 font-medium py-1">Anasayfa</a>
              <a href="#features" className="block text-gray-600 hover:text-gray-900 font-medium py-1">Özellikler</a>
              <a href="#" className="block text-gray-600 hover:text-gray-900 font-medium py-1">Destek</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Modern HR Çözümü
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl xl:text-6xl">
                  Personel yönetimini
                  <span className="block text-blue-600">basitleştirin</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Maaş hesaplamaları, çalışma takibi ve raporlamalar tek platformda. 
                Güvenli, hızlı ve kullanıcı dostu arayüz ile HR işlemlerinizi dijitalleştirin.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/admin-panel/login"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    Yönetici Girişi
                  </a>
                  <a
                    href="/personnel-panel/login"
                    className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                  >
                    Personel Girişi
                  </a>
                </div>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Dashboard Önizleme</h3>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-500">Canlı</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">Toplam Personel</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 transition-all duration-500">
                          {Math.floor(stats.totalEmployees)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">Aktif Kullanıcı</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 transition-all duration-500">
                          {Math.floor(stats.activeUsers)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-900">Sistem Durumu</span>
                        </div>
                        <span className="text-sm font-bold text-green-600 transition-all duration-500">
                          {stats.uptime.toFixed(1)}% Aktif
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Performans</span>
                        <span className="text-gray-900 transition-all duration-500">
                          {stats.uptime >= 99.9 ? '⭐ Olağanüstü' : 
                           stats.uptime >= 99.5 ? 'Mükemmel' : 
                           stats.uptime >= 98.0 ? 'Orta' : 'Çok Kötü'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, stats.uptime)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pürüzsüz Kaydırmalı Banner */}
      <div className="py-4 bg-gray-100 overflow-hidden">
        <div className="flex whitespace-nowrap" ref={bannerRef}>
          {[...texts, ...texts].map((text, i) => (
            <span
              key={i}
              className={`text-2xl font-semibold inline-block mr-16 ${i % 2 === 0 ? 'text-gray-900' : 'text-blue-600'}`}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Kapsamlı HR Çözümleri</h2>
            <p className="mt-4 text-xl text-gray-600">
              Tüm personel yönetimi ihtiyaçlarınız için tek platform
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Maaş Yönetimi</h3>
              <p className="text-gray-600">
                Otomatik maaş hesaplamaları, vergi kesintileri ve ödeme takvimi ile maaş süreçlerinizi kolaylaştırın.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">İzin ve Devam Takibi</h3>
              <p className="text-gray-600">
                Personel izinleri, devam-devamsızlık raporları ve çalışma saatleri takibi için kapsamlı çözüm.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detaylı Raporlama</h3>
              <p className="text-gray-600">
                Özelleştirilebilir raporlar ve analitik araçlarla iş gücü verilerinizi anlamlı içgörülere dönüştürün.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Güvenli Veri Saklama</h3>
              <p className="text-gray-600">
                Şifrelenmiş veri depolama ve rol tabanlı erişim kontrolleriyle hassas bilgilerinizi koruyun.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4a2 2 0 11-4 0 2 2 0 014 0zM6 20h4a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performans Yönetimi</h3>
              <p className="text-gray-600">
                Çalışan performans değerlendirmeleri, hedef takibi ve geri bildirim sistemleri.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">İletişim Portalı</h3>
              <p className="text-gray-600">
                Duyurular, anketler ve mesajlaşma özellikleriyle kurum içi iletişimi güçlendirin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">HR Yönetiminde Dijital Dönüşüme Hazır mısınız?</h2>
          <p className="mt-4 text-xl text-blue-100">
            Personel yönetimi süreçlerinizi optimize edin ve zamandan tasarruf edin
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/demo-talep"
              className="bg-white text-blue-700 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Hemen Başla
            </a>
            <a
              href="/iletisim"
              className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              İletişime Geçin
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">ArjenDev</h3>
                  <p className="text-sm text-gray-400">HR Management</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Modern HR çözümleri ile işletmenizin personel yönetimini dijitalleştiriyoruz.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Özellikler</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Fiyatlandırma</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Kullanım Durumları</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Entegrasyonlar</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kaynaklar</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Dokümantasyon</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Eğitimler</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Destek</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">SSS</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">info@arjendev.com</li>
                <li className="text-gray-400">+90 212 555 01 02</li>
                <li className="text-gray-400">Maslak, Istanbul</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2023 ArjenDev. Tüm hakları saklıdır.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Gizlilik Politikası</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Kullanım Şartları</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Çerezler</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
