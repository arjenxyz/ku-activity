"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import MenuItems from "./MenuItems";
import LogoutButton from "./LogoutButton";

export const Sidebar = () => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null); // Başlangıçta null

  // URL'deki proje ID'sini belirleme
  useEffect(() => {
    const match = pathname.match(/^\/admin-panel\/proje\/([a-f0-9-]+)$/);
    if (match) {
      const projectIdString = match[1];
      const projectIdNumber = parseInt(projectIdString, 10); // String'i number'a çevir
      setProjectId(projectIdNumber);
    } else {
      setProjectId(null); // Proje ID'si yoksa null yap
    }
  }, [pathname]);

  // Eğer proje ID'si yoksa Sidebar'ı gösterme
  if (!projectId) {
    return null;
  }

  return (
    <>
      {/* Menü açma/kapatma düğmesi */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-700 text-white shadow-lg hover:bg-gray-600 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
      </button>

      {/* Yan Menü */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white text-gray-900 shadow-xl flex flex-col transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Üst Kontrol Paneli */}
          <div className="p-4 border-b border-gray-300 flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-blue-600 text-white p-2 rounded-lg">AP</span>
              Admin Panel - {projectId}
            </h2>
          </div>

          {/* Menü Öğeleri */}
          <MenuItems pathname={pathname} projectId={projectId} />

          {/* Alt Kısım */}
          <div className="p-4 border-t border-gray-300 mt-auto">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* İçerik için boşluk bırak */}
      <div
        className={`fixed top-0 left-0 h-screen w-screen bg-black/50 z-30 transition-opacity ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
    </>
  );
};

export default Sidebar;
