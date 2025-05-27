import { AiOutlineLogout } from "react-icons/ai";

const LogoutButton = () => {
  const handleLogout = () => {
    alert("Çıkış yapıldı");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow"
    >
      <AiOutlineLogout className="text-lg" />
      <span>Çıkış Yap</span>
    </button>
  );
};

export default LogoutButton;
