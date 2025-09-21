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
<footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
  {/* Background Effects */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
    <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-400 rounded-full blur-2xl"></div>
  </div>

  <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
    {/* Ana İçerik */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      
      {/* Logo ve Açıklama */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-2xl">A</span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur-lg opacity-30"></div>
          </div>
          <div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">ArjenDev</h3>
            <p className="text-blue-200 text-sm font-medium tracking-wide">HR Management Solutions</p>
          </div>
        </div>
        
        <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
          Modern HR çözümleri ile işletmenizin personel yönetimini 
          <span className="text-blue-300 font-semibold"> dijitalleştiriyoruz</span>.
        </p>
        
        {/* Sosyal Medya */}
        <div className="flex space-x-4">
          <a href="#" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
          <a href="#" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="#" className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-pink-500/25">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.110.221.082.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* İletişim Bilgileri */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">İletişim</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <a href="mailto:info@arjendev.com" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">
              info@arjendev.com
            </a>
          </div>
          
          <div className="flex items-center space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className="text-slate-300 font-medium">+90 212 555 01 02</span>
          </div>
          
          <div className="flex items-center space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-slate-300 font-medium">Maslak, Istanbul</span>
          </div>
        </div>
      </div>

      {/* Hızlı Linkler */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">Hızlı Linkler</h3>
        <div className="grid grid-cols-2 gap-3">
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            Ana Sayfa
          </a>
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            Hakkımızda
          </a>
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            Hizmetler
          </a>
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            İletişim
          </a>
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            Blog
          </a>
          <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20">
            Kariyer
          </a>
        </div>
      </div>
    </div>

    {/* Ayırıcı Çizgi */}
    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-6"></div>

    {/* Alt Kısım */}
    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-slate-400 text-sm">Sistem Aktif</span>
        </div>
        <span className="text-slate-600">•</span>
        <p className="text-slate-400 text-sm">© 2023 ArjenDev. Tüm hakları saklıdır.</p>
      </div>
      
      <div className="flex items-center space-x-6">
        <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium relative group">
          Gizlilik Politikası
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
        </a>
        <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium relative group">
          Kullanım Şartları
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
        </a>
        <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium relative group">
          KVKK
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
        </a>
      </div>
    </div>
  </div>

  {/* Alt Dekoratif Çizgi */}
  <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"></div>
</footer>
    </div>
  );
}
