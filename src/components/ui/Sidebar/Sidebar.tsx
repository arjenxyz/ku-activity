"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiLayout, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import MenuItems from "./MenuItems";
import LogoutButton from "./LogoutButton";

type SidebarProps = {
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
};

const Sidebar: React.FC<SidebarProps> = ({ setSettingsOpen }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/admin-panel\/proje\/([a-f0-9-]{36})/);
    setProjectId(match ? match[1] : null);
  }, [pathname]);

  if (!projectId) return null;

  return (
    <>
      {/* Menü Açma Butonu (Su Damlası Efekti) */}
      {!sidebarOpen && (
        <motion.button
          onClick={() => setSidebarOpen(true)}
          className="group fixed top-6 left-4 z-50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300 }}
          aria-label="Toggle sidebar"
        >
          <div className="relative">
            {/* Ana Buton */}
            <div
              className="p-1.5 rounded-full backdrop-blur-lg 
                bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10
                shadow-lg shadow-black/10 hover:shadow-black/20
                dark:shadow-white/10 dark:hover:shadow-white/20
                transition-all duration-300"
            >
              {/* İç Kontur */}
              <div
                className="p-2 rounded-full bg-gradient-to-br 
                  from-white/30 to-white/10 dark:from-black/30 dark:to-black/10
                  border border-white/20 dark:border-black/20"
              >
                {/* İkon */}
                <FiChevronRight
                  className="w-6 h-6 text-black dark:text-white 
                    transform group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>

            {/* Hover Efekt Işıltısı */}
            <div
              className="absolute inset-0 rounded-full 
                bg-gradient-to-br from-blue-400/20 to-purple-400/20 
                opacity-0 group-hover:opacity-100 blur-md
                transition-opacity duration-300 pointer-events-none"
            />

            {/* Su Damlası Yansıması */}
            <div
              className="absolute top-0 left-0 w-full h-full 
                rounded-full bg-gradient-to-br from-white/30 to-transparent 
                opacity-30 pointer-events-none"
            />
          </div>
        </motion.button>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col z-40"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FiLayout className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Proje Yönetimi
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                        #{projectId.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menü Elemanları */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <MenuItems pathname={pathname} projectId={projectId} />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors shadow"
                  >
                    <FiSettings className="text-xl" />
                    <span>Ayarları Aç</span>
                  </button>
                  <div className="mt-4">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
