import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { HonorIconTile, type HonorIconName, type HonorIconTheme } from "@/components/icons/HonorIcons";
import strings from '@json/src/components/ui/Sidebar/MenuItems.json';

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

function categoryIcon(name: HonorIconName, theme: HonorIconTheme) {
  return <HonorIconTile name={name} theme={theme} size="sm" />;
}

const MenuItems = ({ pathname, projectId }: MenuItemsProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        label: strings.personnelManagement,
        icon: categoryIcon('users', 'blue'),
        subItems: [
          {
            label: strings.sub.addEmployee,
            href: `/admin-panel/proje/${projectId}/new`,
          },
          {
            label: strings.sub.employeeList,
            href: `/admin-panel/proje/${projectId}/list`,
          },
          {
            label: strings.sub.addAdvance,
            href: `/admin-panel/arjen/avans`,
          },
          {
            label: strings.sub.addWorkLog,
            href: `/admin-panel/arjen/yevmiye`,
          },
          {
            label: strings.sub.addMinimum,
            href: `/admin-panel/proje/${projectId}/add-minimum`,
          },
        ],
      },
      {
        label: strings.queryManagement,
        icon: categoryIcon('search', 'orange'),
        subItems: [
          {
            label: strings.sub.employeeQuery,
            href: `/admin-panel/arjen/sorgulama/${projectId}`,
          },
          {
            label: strings.sub.adminQuery,
            href: `/admin-panel/sorgulama/admin/${projectId}`,
          },
          {
            label: strings.sub.employeePasswords,
            href: `/admin-panel/sorgulama/personel-passwords/${projectId}`,
          },
          {
            label: strings.sub.adminPasswords,
            href: `/admin-panel/sorgulama/admin-passwords/${projectId}`,
          },
          {
            label: strings.sub.advanceQuery,
            href: `/admin-panel/sorgulama/advance/${projectId}`,
          },
          {
            label: strings.sub.workLogQuery,
            href: `/admin-panel/sorgulama/daily/${projectId}`,
          },
          {
            label: strings.sub.minimumQuery,
            href: `/admin-panel/sorgulama/minimum/${projectId}`,
          },
        ],
      },
      {
        label: strings.reports,
        icon: categoryIcon('report', 'violet'),
        subItems: [
          {
            label: strings.sub.adminReports,
            href: `/admin-panel/reports/admin/${projectId}`,
          },
          {
            label: strings.sub.dailyApproved,
            href: `/admin-panel/reports/daily-approved/${projectId}`,
          },
          {
            label: strings.sub.notApproved,
            href: `/admin-panel/reports/not-approved/${projectId}`,
          },
        ],
      },
      {
        label: strings.finance,
        icon: categoryIcon('finance', 'emerald'),
        subItems: [
          {
            label: strings.sub.status,
            href: `/admin-panel/arjen/durum/${projectId}`,
          },
          {
            label: strings.sub.payroll,
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
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-gray-400 dark:text-gray-500"
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
                      className="ml-4 mt-1 space-y-1"
                    >
                      {subItems.map(({ label: subLabel, href: subHref }) => (
                        <Link
                          href={subHref}
                          key={subHref}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors
                            ${
                              pathname?.startsWith(subHref)
                                ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                            }`}
                        >
                          <HonorIconTile name="plus" theme="blue" size="xs" muted />
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
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                {icon}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
