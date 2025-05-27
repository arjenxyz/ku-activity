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
      {/* Menü Açma Butonu (Ters Cam Efekti) */}
      {!sidebarOpen && (
        <motion.button
          onClick={() => setSidebarOpen(true)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed top-6 left-2 z-50 w-14 h-14 flex items-center justify-center rounded-full border border-white/20 bg-gray-900/60 dark:bg-white/60 backdrop-blur-md shadow-2xl hover:bg-gray-800/80 dark:hover:bg-white/80 transition-all duration-300"
          aria-label="Menüyü Aç"
        >
          <FiChevronRight className="w-6 h-6 text-white dark:text-gray-900" />
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
              className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-black/20 to-gray-900/80 dark:from-white/40 dark:to-gray-50 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col z-40"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-900 dark:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FiLayout className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white dark:text-gray-900">
                        Proje Yönetimi
                      </h2>
                      <p className="text-sm text-gray-300 dark:text-gray-500 font-mono mt-1">
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
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-900 dark:bg-gray-50">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-800 dark:bg-gray-200 text-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors shadow"
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
              className="fixed inset-0 bg-black/40 dark:bg-gray-200/40 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
