'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import dayjs from 'dayjs';

type Project = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  password_code: string | null;
};

export default function PersonnelLogin() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Projeleri çek
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('projects').select('id, name').order('name');
      if (error) {
        console.error("Projeler alınamadı:", error);
      }
      setProjects(data || []);
    })();
  }, []);

  // Seçili projedeki personelleri çek
  useEffect(() => {
    setEmployeeId('');
    setPassword('');
    setError('');
    if (!projectId) {
      setEmployees([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, password_code, project_id')
        .eq('project_id', projectId)
        .order('name');
      if (error) {
        console.error("Personeller alınamadı:", error);
        setError("Personeller alınamadı: " + error.message);
      }
      setEmployees(data || []);
    })();
  }, [projectId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!projectId || !employeeId || !password) {
        setError("Lütfen tüm alanları doldurunuz");
        setIsLoading(false);
        return;
      }

      // Seçili personeli bul
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        setError("Lütfen geçerli bir personel seçiniz");
        setIsLoading(false);
        return;
      }

      // Şifre alanını kontrol et
      if (
        typeof employee.password_code !== "string" ||
        !employee.password_code ||
        employee.password_code.trim() === ""
      ) {
        setError("Bu personele şifre atanmadı, yöneticinize başvurun.");
        setIsLoading(false);
        return;
      }

      // Şifre kontrolü (düz şifre)
      const isValid = password === employee.password_code;
      if (!isValid) {
        setError("Geçersiz şifre");
        setIsLoading(false);
        return;
      }

      // Oturum oluşturma
      const sessionToken = crypto.randomUUID();
      const { error: sessionError } = await supabase
        .from('personnel_sessions')
        .insert({
          employee_id: employee.id,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        });

      if (sessionError) throw sessionError;

      // Cookie ve yönlendirme
      // Development ortamında Secure flag olmadan setle, productionda Secure flag ile setle
      const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
      const cookieStr =
        `personnel_session=${sessionToken}; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}` +
        (isLocalhost ? "" : "; Secure");
      document.cookie = cookieStr;

      router.push('/personnel-panel');

    } catch (err) {
      console.error("Giriş hatası:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 p-4">
      <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md space-y-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-indigo-300 to-blue-400 bg-clip-text text-transparent">
              Personel Girişi
            </span>
          </h1>
        </div>

        <div className="space-y-4">
          {/* Proje Seçimi */}
          <div>
            <select
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              required
            >
              <option value="">Proje Seçiniz</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Personel Seçimi */}
          <div>
            <select
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              disabled={!projectId || employees.length === 0}
              required
            >
              <option value="">Personel Seçiniz</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Şifre Girişi */}
          <div className="group relative">
            <input
              type="password"
              required
              disabled={!employeeId}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
            />
            <label className="absolute left-4 top-3.5 text-gray-400 pointer-events-none transition-all duration-200 group-focus-within:-translate-y-6 group-focus-within:text-sm group-focus-within:text-indigo-300 group-[input:not(:placeholder-shown)]:-translate-y-6 group-[input:not(:placeholder-shown)]:text-sm">
              Şifre
            </label>
          </div>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="text-red-400 text-center font-medium mt-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow hover:from-indigo-600 hover:to-blue-600 transition"
        >
          {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}