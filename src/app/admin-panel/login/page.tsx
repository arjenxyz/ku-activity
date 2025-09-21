'use client';

import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface LoginData {
  email: string;
  phone: string;
  password: string;
}

interface ResetData {
  email: string;
  phone: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type LoginMethod = 'email' | 'phone';
type ResetMethod = 'email' | 'phone';

export default function AdminAuth() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [resetMethod, setResetMethod] = useState<ResetMethod>('email');
  const [loginData, setLoginData] = useState<LoginData>({ email: '', phone: '', password: '' });
  const [resetData, setResetData] = useState<ResetData>({ email: '', phone: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const loginPhoneRef = useRef<HTMLInputElement>(null);
  const resetPhoneRef = useRef<HTMLInputElement>(null);
  const registerPhoneRef = useRef<HTMLInputElement>(null);

  // Oturum kontrolü
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin-panel/dashboard');
      }
    };
    
    checkSession();
  }, [router]);

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone' && loginMethod === 'phone') {
      const formattedValue = formatPhoneNumber(value);
      setLoginData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setLoginData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResetChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone' && resetMethod === 'phone') {
      const formattedValue = formatPhoneNumber(value);
      setResetData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setResetData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegisterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formattedValue = formatPhoneNumber(value);
      setRegisterData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length > 10) {
      return numbers.slice(0, 10);
    }
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[\d]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>, method: 'login' | 'reset' | 'register') => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbers = pastedData.replace(/\D/g, '');
    const formattedValue = formatPhoneNumber(numbers);
    
    if (method === 'login') {
      setLoginData(prev => ({ ...prev, phone: formattedValue }));
    } else if (method === 'reset') {
      setResetData(prev => ({ ...prev, phone: formattedValue }));
    } else {
      setRegisterData(prev => ({ ...prev, phone: formattedValue }));
    }
  };

  const showTempMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string) => {
    setter(message);
    setTimeout(() => setter(''), 10000);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let emailForLogin = '';
      
      if (loginMethod === 'email') {
        emailForLogin = loginData.email;
      } else {
        const cleanPhone = loginData.phone.replace(/\D/g, '');
        emailForLogin = `${cleanPhone}@arjendev.com`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailForLogin,
        password: loginData.password,
      });
      
      if (error) throw error;
      showTempMessage(setSuccessMessage, 'Başarıyla giriş yaptınız. Yönlendiriliyorsunuz...');
      router.push('/admin-panel/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Giriş bilgileriniz hatalı. Lütfen tekrar deneyin.';
      showTempMessage(setErrorMessage, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let emailForReset = '';
      
      if (resetMethod === 'email') {
        emailForReset = resetData.email;
      } else {
        const cleanPhone = resetData.phone.replace(/\D/g, '');
        emailForReset = `${cleanPhone}@arjendev.com`;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailForReset,
        { redirectTo: `${window.location.origin}/admin-panel/login/pass-reset` }
      );
      
      if (error) throw error;
      
      if (resetMethod === 'email') {
        showTempMessage(setSuccessMessage, 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
      } else {
        showTempMessage(setSuccessMessage, 'Şifre sıfırlama bağlantısı telefonunuza gönderildi. Lütfen mesajlarınızı kontrol edin.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      showTempMessage(setErrorMessage, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (registerData.password !== registerData.confirmPassword) {
      showTempMessage(setErrorMessage, 'Şifreler eşleşmiyor. Lütfen kontrol edin.');
      setIsLoading(false);
      return;
    }

    const cleanPhone = registerData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showTempMessage(setErrorMessage, 'Lütfen geçerli bir telefon numarası girin.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: { 
          data: { 
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: cleanPhone,
            user_type: 'admin' 
          } 
        },
      });
      
      if (error) throw error;
      showTempMessage(setSuccessMessage, 'Kaydınız başarıyla oluşturuldu. Doğrulama e-postası gönderildi. Lütfen e-posta adresinizi kontrol edin.');
      setTimeout(() => setActiveTab('login'), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      showTempMessage(setErrorMessage, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      {/* Logo ve Başlık */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-md mb-4">
          <span className="text-white font-bold text-2xl">A</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">ArjenDev</h1>
        <p className="text-gray-500 text-sm">İnsan Kaynakları Yönetim Sistemi</p>
      </div>

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {activeTab === 'login' && 'Yönetici Girişi'}
          {activeTab === 'reset' && 'Şifremi Unuttum'}
          {activeTab === 'register' && 'Yönetici Kaydı'}
        </h2>

        {/* Başarı / Hata Mesajları */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Formlar */}
        {activeTab === 'login' && (
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            {/* Giriş Yöntemi Seçici */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                E-posta ile
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Telefon ile
              </button>
            </div>

            {/* E-posta/Telefon Inputu */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1.5">
                {loginMethod === 'email' ? 'E-posta Adresi' : 'Telefon Numarası'}
              </label>
              {loginMethod === 'email' ? (
                <input
                  id="identifier"
                  name="email"
                  type="email"
                  placeholder="ornek@arjendev.com"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">+90</span>
                  </div>
                  <input
                    ref={loginPhoneRef}
                    id="identifier"
                    name="phone"
                    type="tel"
                    placeholder="(5XX) XXX-XXXX"
                    value={loginData.phone}
                    onChange={handleLoginChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={(e) => handlePhonePaste(e, 'login')}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    maxLength={14}
                  />
                </div>
              )}
              {loginMethod === 'phone' && (
                <p className="text-xs text-gray-500 mt-1">Örnek: (555) 123-4567</p>
              )}
            </div>

            {/* Şifre Inputu */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Şifrenizi girin"
                value={loginData.password}
                onChange={handleLoginChange}
                className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : 'Giriş Yap'}
            </button>
          </form>
        )}

        {activeTab === 'reset' && (
          <form className="space-y-5" onSubmit={handleResetSubmit}>
            {/* Şifre Sıfırlama Yöntemi Seçici */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setResetMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${resetMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                E-posta ile
              </button>
              <button
                type="button"
                onClick={() => setResetMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${resetMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Telefon ile
              </button>
            </div>

            {/* E-posta/Telefon Inputu */}
            <div>
              <label htmlFor="resetIdentifier" className="block text-sm font-medium text-gray-700 mb-1.5">
                {resetMethod === 'email' ? 'E-posta Adresi' : 'Telefon Numarası'}
              </label>
              {resetMethod === 'email' ? (
                <input
                  id="resetIdentifier"
                  name="email"
                  type="email"
                  placeholder="ornek@arjendev.com"
                  value={resetData.email}
                  onChange={handleResetChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">+90</span>
                  </div>
                  <input
                    ref={resetPhoneRef}
                    id="resetIdentifier"
                    name="phone"
                    type="tel"
                    placeholder="(5XX) XXX-XXXX"
                    value={resetData.phone}
                    onChange={handleResetChange}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={(e) => handlePhonePaste(e, 'reset')}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    maxLength={14}
                  />
                </div>
              )}
              {resetMethod === 'phone' && (
                <p className="text-xs text-gray-500 mt-1">Örnek: (555) 123-4567</p>
              )}
            </div>

            {/* Şifre Sıfırlama Butonu */}
            <button
  type="submit"
  disabled={isLoading}
  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors flex justify-center items-center"
>
  {isLoading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Gönderiliyor...
    </>
  ) : (
    'Şifre Sıfırlama Bağlantısı Gönder'
  )}
</button>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="space-y-5" onSubmit={handleRegisterSubmit}>
            {/* Ad ve Soyad - Yan Yana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ad
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Adınız"
                  value={registerData.firstName}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Soyad
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Soyadınız"
                  value={registerData.lastName}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@arjendev.com"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Telefon Numarası - Formatlı */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon Numarası
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">+90</span>
                </div>
                <input
                  ref={registerPhoneRef}
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(5XX) XXX-XXXX"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={(e) => handlePhonePaste(e, 'register')}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  maxLength={14}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Örnek: (555) 123-4567</p>
            </div>

            {/* Şifre ve Şifre Tekrarı - Yan Yana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Şifre Tekrarı
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Kayıt Butonu */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydoluyor...
                </>
              ) : 'Hesap Oluştur'}
            </button>
          </form>
        )}

        {/* Linkler ve Geri Dön Butonu */}
        {activeTab === 'login' && (
          <div className="mt-6 flex justify-between text-sm">
            <button 
              type="button" 
              onClick={() => setActiveTab('reset')} 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Şifremi unuttum
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('register')} 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Yeni hesap oluştur
            </button>
          </div>
        )}

        {activeTab !== 'login' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setActiveTab('login')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Giriş sayfasına dön
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} ArjenDev - Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}
