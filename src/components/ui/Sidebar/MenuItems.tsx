import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { AiOutlineFolder, AiOutlineFileText, AiOutlineProject, AiOutlineDown } from "react-icons/ai";
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
  projectId: number;
}

const MenuItems = ({ pathname, projectId }: MenuItemsProps) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const menuItems = useMemo<MenuItem[]>(() => [
    {
      label: "Projects",
      icon: <AiOutlineProject className="text-lg" />,
      subItems: [
        {
          label: "Add New Personnel",
          href: `/admin-panel/proje/${projectId}/new`,
        },
      ],
    },
    {
      label: "Advance Operations",
      icon: <AiOutlineFolder className="text-lg" />,
      subItems: [
        {
          label: "Add Advance",
          href: `/admin-panel/arjen/avans/${projectId}`,
        },
        {
          label: "Advance List",
          href: `/admin-panel/arjen/avans/liste/${projectId}`,
        },
      ],
    },
    {
      label: "Query",
      icon: <AiOutlineFileText className="text-lg" />,
      href: `/admin-panel/arjen/sorgulama/${projectId}/`,
    },
  ], [projectId]);

  const isActive = useCallback((href?: string, subItems?: MenuItem['subItems']) => {
    if (href) return pathname?.startsWith(href);
    if (subItems) return subItems.some(sub => pathname?.startsWith(sub.href));
    return false;
  }, [pathname]);

  const toggleMenu = useCallback((label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  }, []);

  return (
    <nav className="flex-1 overflow-y-auto py-2 px-1">
      {menuItems.map(({ label, icon, href, subItems }) => {
        const active = isActive(href, subItems);
        const isOpen = openMenus.includes(label);

        return (
          <div key={label} className="mb-1">
            {subItems ? (
              <>
                <button
                  onClick={() => toggleMenu(label)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  aria-expanded={isOpen}
                  aria-controls={`submenu-${label}`}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AiOutlineDown className="text-sm" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={`submenu-${label}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-8 mt-1 space-y-1"
                    >
                      {subItems.map(({ label: subLabel, href: subHref }) => (
                        <Link
                          href={subHref}
                          key={subHref}
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname?.startsWith(subHref)
                              ? "bg-blue-50 dark:bg-blue-800/20 text-blue-600 dark:text-blue-300"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default MenuItems;
