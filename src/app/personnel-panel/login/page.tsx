'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { FiLayers, FiUser, FiLock, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

type Project = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  password_code: string | null;
};

// Helper: Random blob data for animated bg (client-only, avoids hydration mismatch)
const generateBlobs = (count: number) =>
  Array.from({ length: count }, () => ({
    width: 120 + Math.random() * 120,
    height: 120 + Math.random() * 120,
    top: Math.random() * 85,
    left: Math.random() * 85,
    scale: 0.5 + Math.random(),
    duration: 12 + Math.random() * 12,
  }));

export default function PersonnelLogin() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [blobs, setBlobs] = useState<any[]>([]); // for bg animation
  const projectRef = useRef<HTMLDivElement>(null);
  const employeeRef = useRef<HTMLDivElement>(null);

  // Generate bg blobs only on client (avoids hydration mismatch)
  useEffect(() => {
    setBlobs(generateBlobs(10));
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (error) console.error('Proje yükleme hatası:', error);
      setProjects(data || []);
    };
    fetchProjects();
  }, []);

  // Fetch employees for selected project
  useEffect(() => {
    setEmployeeId('');
    setPassword('');
    setError('');
    const fetchEmployees = async () => {
      if (!projectId) {
        setEmployees([]);
        return;
      }
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, password_code')
        .eq('project_id', projectId)
        .order('name');
      if (error) console.error('Personel yükleme hatası:', error);
      setEmployees(data || []);
    };
    fetchEmployees();
  }, [projectId]);

  // Dropdowns close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setIsProjectOpen(false);
      }
      if (employeeRef.current && !employeeRef.current.contains(event.target as Node)) {
        setIsEmployeeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!projectId || !employeeId || !password) {
        setError("Lütfen tüm alanları doldurun");
        setIsLoading(false);
        return;
      }

      const employee = employees.find(e => e.id === employeeId);
      if (!employee?.password_code || password !== employee.password_code) {
        setError("Geçersiz kimlik bilgileri");
        setIsLoading(false);
        return;
      }

      const sessionToken = crypto.randomUUID();
      const { error } = await supabase
        .from('personnel_sessions')
        .insert([{
          employee_id: employeeId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 604800000).toISOString()
        }]);

      if (error) throw error;

      document.cookie = `personnel_session=${sessionToken}; Path=/; SameSite=Strict; Max-Age=604800${location.hostname === 'localhost' ? '' : '; Secure'}`;
      router.push('/personnel-panel');
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError("Sistem hatası - Lütfen tekrar deneyin");
    } finally {
      setIsLoading(false);
    }
  };

  const isProjectDropdownDisabled = projects.length === 0;
  const isEmployeeDropdownDisabled = !projectId || employees.length === 0;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* BG Animations (client only for hydration safety) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blobs.map((blob, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-gray-300/20 to-gray-400/10 dark:from-gray-600/20 dark:to-gray-500/10 rounded-full blur-lg"
            style={{
              width: blob.width,
              height: blob.height,
              top: `${blob.top}%`,
              left: `${blob.left}%`,
              zIndex: 0,
            }}
            initial={{
              scale: blob.scale,
              opacity: 0,
            }}
            animate={{
              scale: [blob.scale, 1.2, blob.scale],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-700"
        style={{ zIndex: 1 }}
      >
        {/* Logo ve Başlık */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="mx-auto w-20 h-20 bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg"
          >
            <span className="text-gray-700 dark:text-gray-200 text-3xl select-none">🔒</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 dark:from-gray-300 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
            Personel Girişi
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-light tracking-wide">
            Lütfen size verilen şifreyle giriş yapın
          </p>
        </div>

        {/* Form Alanları */}
        <div className="space-y-5">
          {/* Proje Seçim Dropdown */}
          <div className="relative group" ref={projectRef}>
            <button
              type="button"
              disabled={isProjectDropdownDisabled}
              className={`
                flex items-center gap-4 w-full bg-white dark:bg-gray-700/10 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3
                transition-all hover:border-gray-400 dark:hover:border-gray-400 text-left relative
                ${isProjectDropdownDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
              tabIndex={-1}
              onClick={() => {
                if (!isProjectDropdownDisabled) setIsProjectOpen(v => !v);
              }}
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/20">
                <FiLayers className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 text-gray-700 dark:text-gray-200 text-base font-medium truncate">
                {projects.find(p => p.id === projectId)?.name || "Proje Seçin"}
              </div>
              <motion.div animate={{ rotate: isProjectOpen ? 180 : 0 }}>
                <FiChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isProjectOpen && !isProjectDropdownDisabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
                >
                  {projects.map((project) => (
                    <button
                      type="button"
                      key={project.id}
                      className={`px-4 py-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors
                        ${projectId === project.id ? 'bg-gray-100 dark:bg-gray-700/20 font-semibold' : ''}
                      `}
                      onClick={() => {
                        setProjectId(project.id);
                        setIsProjectOpen(false);
                      }}
                    >
                      <span className="text-gray-700 dark:text-gray-200">{project.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Personel Seçim Dropdown */}
          <div className="relative group" ref={employeeRef}>
            <button
              type="button"
              disabled={isEmployeeDropdownDisabled}
              className={`
                flex items-center gap-4 w-full bg-white dark:bg-gray-700/10 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3
                transition-all hover:border-gray-400 dark:hover:border-gray-400 text-left relative
                ${isEmployeeDropdownDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
              tabIndex={-1}
              onClick={() => {
                if (!isEmployeeDropdownDisabled) setIsEmployeeOpen(v => !v);
              }}
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/20">
                <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 text-gray-700 dark:text-gray-200 text-base font-medium truncate">
                {employees.find(e => e.id === employeeId)?.name || "Personel Seçin"}
              </div>
              <motion.div animate={{ rotate: isEmployeeOpen ? 180 : 0 }}>
                <FiChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isEmployeeOpen && !isEmployeeDropdownDisabled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
                >
                  {employees.map((employee) => (
                    <button
                      type="button"
                      key={employee.id}
                      className={`px-4 py-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700/20 transition-colors
                        ${employeeId === employee.id ? 'bg-gray-100 dark:bg-gray-700/20 font-semibold' : ''}
                      `}
                      onClick={() => {
                        setEmployeeId(employee.id);
                        setIsEmployeeOpen(false);
                      }}
                    >
                      <span className="text-gray-700 dark:text-gray-200">{employee.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Şifre Girişi */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-4 bg-white dark:bg-gray-700/10 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 transition-all hover:border-gray-400 dark:hover:border-gray-400
              ${!employeeId ? 'opacity-60' : ''}
            `}
          >
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/20">
              <FiLock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <input
              type="password"
              className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 text-base font-medium placeholder-gray-400"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!employeeId}
              autoComplete="current-password"
              maxLength={40}
            />
          </motion.div>
        </div>

        {/* Hata Mesajı */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl text-red-600 dark:text-red-300 text-center text-sm mt-1"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Giriş Butonu */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading || !projectId || !employeeId || !password}
          className={`w-full py-4 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-lg relative overflow-hidden group transition-all
            ${isLoading || !projectId || !employeeId || !password ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-gray-500 dark:border-gray-300 rounded-full border-t-transparent animate-spin"
              />
            ) : (
              <FiLock className="w-5 h-5" />
            )}
            {isLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
          </span>
        </motion.button>

        {/* Alt Bilgi */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-xs font-light tracking-wide flex items-center justify-center gap-2 pt-2">
          <span className="opacity-70">ArjenDev</span>
        </div>
      </motion.form>
    </div>
  );
}