'use client';

import { AiOutlineLogout } from 'react-icons/ai';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';

const LogoutButton = () => {
  const strings = useRegistryStrings('components/ui/Sidebar/LogoutButton');
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      router.push('/admin-panel/login');
      router.refresh();
    } catch (error) {
      console.error(strings.logoutError, error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow"
    >
      <AiOutlineLogout className="text-xl" />
      <span>{strings.logout}</span>
    </button>
  );
};

export default LogoutButton;
