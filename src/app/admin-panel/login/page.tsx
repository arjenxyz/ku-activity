"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import bcrypt from "bcryptjs";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validasyonlar
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Geçerli bir email adresi giriniz");
        return;
      }

      if (!password || password.length < 8) {
        setError("Şifre en az 8 karakter olmalıdır");
        return;
      }

      // Kullanıcı sorgusu
      const { data, error: fetchError } = await supabase
        .from("admins")
        .select("id, email, password_hash")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (fetchError || !data) {
        setError("Geçersiz kimlik bilgileri");
        return;
      }

      // Şifre kontrolü
      const isPasswordValid = await bcrypt.compare(password, data.password_hash);
      if (!isPasswordValid) {
        setError("Geçersiz kimlik bilgileri");
        return;
      }

      // Oturum oluşturma
      const sessionToken = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from("admin_sessions")
        .insert({
          admin_id: data.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        });

      if (sessionError) throw sessionError;

      // Cookie ve yönlendirme
      document.cookie = `admin_session=${sessionToken}; Path=/; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`;
      router.push("/admin-panel/proje");

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Giriş hatası:", err.message);
      } else {
        console.error("Giriş hatası:", err);
      }
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md space-y-6 shadow-xl border border-white/10 relative overflow-hidden"
      >
        {/* Dekoratif arka plan elementleri */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Başlık */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-blue-400 bg-clip-text text-transparent mb-2">
            ArjenDev
          </h1>
          <h2 className="text-xl font-semibold text-gray-200">Yönetici Paneli Girişi</h2>
        </div>

        {/* Form Alanları */}
        <div className="space-y-4">
          <div className="group relative">
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder=" "
            />
            <label className="absolute left-4 top-3.5 text-gray-400 pointer-events-none transition-all duration-200 group-focus-within:-translate-y-6 group-focus-within:text-sm group-focus-within:text-indigo-300 group-[input:not(:placeholder-shown)]:-translate-y-6 group-[input:not(:placeholder-shown)]:text-sm">
              Email Adresiniz
            </label>
          </div>

          <div className="group relative">
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder=" "
            />
            <label className="absolute left-4 top-3.5 text-gray-400 pointer-events-none transition-all duration-200 group-focus-within:-translate-y-6 group-focus-within:text-sm group-focus-within:text-indigo-300 group-[input:not(:placeholder-shown)]:-translate-y-6 group-[input:not(:placeholder-shown)]:text-sm">
              Şifreniz
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-2 animate-fade-in">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span>Giriş Yapılıyor...</span>
            </div>
          ) : (
            <>
              <span className="relative z-10">Giriş Yap</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </>
          )}
        </button>

        <div className="text-center pt-4 border-t border-white/10">
          <a href="#" className="text-sm text-gray-400 hover:text-indigo-300 transition-colors">
            Şifremi Unuttum
          </a>
        </div>
      </form>
    </div>
  );
}
