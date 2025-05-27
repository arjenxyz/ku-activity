import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { FiPlus, FiFileText, FiUsers, FiDollarSign, FiChevronRight, FiSearch, FiClipboard } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  subItems?: {
    label: string;
    href: string;
  }[];
}

interface MenuItemsProps {
  pathname: string;
  projectId: string;
}

const MenuItems = ({ pathname, projectId }: MenuItemsProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        label: "Personel Yönetimi",
        icon: <FiUsers className="text-lg text-blue-500" />,
        subItems: [
          {
            label: "Yeni Personel Ekle",
            href: `/admin-panel/proje/${projectId}/new`,
          },
          {
            label: "Personel Listesi",
            href: `/admin-panel/proje/${projectId}/list`,
          },
          {
            label: "Avans Ekle",
            href: `/admin-panel/proje/${projectId}/add-advance`,
          },
          {
            label: "Yevmiye Ekle",
            href: `/admin-panel/proje/${projectId}/add-daily`,
          },
          {
            label: "Asgari Ekle",
            href: `/admin-panel/proje/${projectId}/add-minimum`,
          },
        ],
      },
      {
        label: "Sorgulama Yönetimi",
        icon: <FiSearch className="text-lg text-orange-500" />,
        subItems: [
          {
            label: "Personel Sorgulaması",
            href: `/admin-panel/sorgulama/personel/${projectId}`,
          },
          {
            label: "Admin Sorgulama",
            href: `/admin-panel/sorgulama/admin/${projectId}`,
          },
          {
            label: "Personel Şifreleri",
            href: `/admin-panel/sorgulama/personel-passwords/${projectId}`,
          },
          {
            label: "Admin Şifreleri",
            href: `/admin-panel/sorgulama/admin-passwords/${projectId}`,
          },
          {
            label: "Avans Sorgulama",
            href: `/admin-panel/sorgulama/advance/${projectId}`,
          },
          {
            label: "Yevmiye Sorgulama",
            href: `/admin-panel/sorgulama/daily/${projectId}`,
          },
          {
            label: "Asgari Sorgulama",
            href: `/admin-panel/sorgulama/minimum/${projectId}`,
          },
        ],
      },
      {
        label: "Raporlar",
        icon: <FiFileText className="text-lg text-purple-500" />,
        subItems: [
          {
            label: "Admin Raporları",
            href: `/admin-panel/reports/admin/${projectId}`,
          },
          {
            label: "Günlük Onaylananlar",
            href: `/admin-panel/reports/daily-approved/${projectId}`,
          },
          {
            label: "Onaylanmayanlar",
            href: `/admin-panel/reports/not-approved/${projectId}`,
          },
        ],
      },
      {
        label: "Finans İşlemleri",
        icon: <FiDollarSign className="text-lg text-green-500" />,
        subItems: [
          {
            label: "Avans Yönetimi",
            href: `/admin-panel/arjen/avans/${projectId}`,
          },
          {
            label: "Maaş Bordroları",
            href: `/admin-panel/arjen/bordro/${projectId}`,
          },
        ],
      },
    ],
    [projectId]
  );

  const isActive = useCallback(
    (href?: string, subItems?: MenuItem["subItems"]) => {
      if (href) return pathname?.startsWith(href);
      if (subItems) return subItems.some((sub) => pathname?.startsWith(sub.href));
      return false;
    },
    [pathname]
  );

  const toggleMenu = useCallback((label: string) => {
    setOpenMenu((prev) => (prev === label ? null : label));
  }, []);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
      {menuItems.map(({ label, icon, href, subItems }) => {
        const active = isActive(href, subItems);
        const isOpen = openMenu === label;

        return (
          <div key={label} className="relative group">
            {subItems ? (
              <>
                <button
                  onClick={() => toggleMenu(label)}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all
                    ${
                      active || isOpen
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-white rounded-lg shadow-sm">
                      {icon}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {label}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-gray-400"
                  >
                    <FiChevronRight />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="ml-10 mt-1 space-y-1"
                    >
                      {subItems.map(({ label: subLabel, href: subHref }) => (
                        <Link
                          href={subHref}
                          key={subHref}
                          className={`flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors
                            ${
                              pathname?.startsWith(subHref)
                                ? "bg-blue-50 text-blue-600 font-semibold"
                                : "hover:bg-gray-50 text-gray-600"
                            }`}
                        >
                          <FiPlus className="mr-2 text-blue-400" />
                          {subLabel}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                href={href!}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
              >
                <span className="p-2 bg-white rounded-lg shadow-sm">
                  {icon}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default MenuItems;
