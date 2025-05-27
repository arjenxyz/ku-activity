"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FiChevronRight, FiX, FiLayout } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import MenuItems from "./MenuItems";
import LogoutButton from "./LogoutButton";

export const Sidebar = () => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // UUID formatında proje ID'sini yakalama
  useEffect(() => {
    const match = pathname.match(/^\/admin-panel\/proje\/([a-f0-9-]{36})/);
    setProjectId(match ? match[1] : null);
  }, [pathname]);

  if (!projectId) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-4 z-50 p-3 bg-white shadow-xl rounded-full hover:shadow-lg transition-all"
        whileHover={{ scale: 1.05 }}
        animate={{ rotate: sidebarOpen ? 180 : 0 }}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <FiX className="w-5 h-5 text-gray-700" />
        ) : (
          <FiChevronRight className="w-5 h-5 text-gray-700" />
        )}
      </motion.button>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-2xl flex flex-col z-40"
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiLayout className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Proje Yönetimi
                      </h2>
                      <p className="text-sm text-gray-500 font-mono mt-1">
                        #{projectId.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <MenuItems pathname={pathname} projectId={projectId} />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <LogoutButton />
                </div>
              </div>
            </motion.aside>

            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
