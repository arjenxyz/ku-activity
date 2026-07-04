"use client";


import { useState } from "react";
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import bcrypt from "bcryptjs";

export default function AdminLogin() {

  const strings = useRegistryStrings('app/admin-panel/login/yedek');
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
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(strings.invalidEmail);
        return;
      }

      if (!password || password.length < 8) {
        setError(strings.passwordMinLength);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("admins")
        .select("id, email, password_hash")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (fetchError || !data) {
        setError(strings.invalidCredentials);
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, data.password_hash);
      if (!isPasswordValid) {
        setError(strings.invalidCredentials);
        return;
      }

      const sessionToken = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from("admin_sessions")
        .insert({
          admin_id: data.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        });

      if (sessionError) {
        setError(strings.sessionFailed);
        return;
      }

      document.cookie = `admin_session=${sessionToken}; Path=/; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`;
      router.push("/admin-panel/proje");

    } catch (err) {
      console.error("Giriş hatası:", err);
      setError(strings.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-semibold text-center text-indigo-600">
          {strings.title}
        </h2>

        <div>
          <label className="block mb-1 font-medium">{strings.emailLabel}</label>
          <input
            type="email"
            required
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">{strings.passwordLabel}</label>
          <input
            type="password"
            required
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {strings.loggingIn}
            </>
          ) : (
            strings.loginButton
          )}
        </button>
      </form>
    </div>
  );
}
