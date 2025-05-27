"use client";

import { AiOutlineLogout } from "react-icons/ai";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Çıkış API çağrısı (isteğe bağlı)
      await fetch("/api/logout", { method: "POST" });

      alert("Çıkış yapıldı");
      router.push("/admin-panel"); // Çıkış sonrası giriş sayfasına yönlendirme
    } catch (error) {
      console.error("Çıkış yaparken bir hata oluştu:", error);
      alert("Çıkış yaparken bir hata oluştu.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow"
    >
      <AiOutlineLogout className="text-xl" />
      <span>Çıkış Yap</span>
    </button>
  );
};

export default LogoutButton;
