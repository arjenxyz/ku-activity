"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import MenuItems from "./MenuItems";
import LogoutButton from "./LogoutButton";
import SidebarToggleButton from "./SidebarToggleButton";

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
      {!sidebarOpen && (
        <SidebarToggleButton onClick={() => setSidebarOpen(true)} />
      )}

      {sidebarOpen && (
        <>
          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col z-40">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 4H20V20H4V4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <MenuItems pathname={pathname} projectId={projectId} />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors shadow"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c1.656 0 3-1.344 3-3s-1.344-3-3-3-3 1.344-3 3 1.344 3 3 3zM12 14c-3.31 0-6 2.69-6 6 0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2 0-3.31-2.69-6-6-6z"
                    ></path>
                  </svg>
                  <span>Ayarları Aç</span>
                </button>

                <div className="mt-4">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
          />
        </>
      )}
    </>
  );
};

export default Sidebar;
