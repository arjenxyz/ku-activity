'use client';

import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { AiOutlineHome, AiOutlineFolder, AiOutlineSetting, AiOutlineMenu } from "react-icons/ai";
import { FiLogOut, FiChevronDown } from "react-icons/fi";
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

const EnhancedMenu = ({ pathname }: { pathname: string }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = useMemo<MenuItem[]>(() => [
    {
      label: "Home",
      href: "/dashboard",
      icon: <AiOutlineHome className="text-lg" />,
    },
    {
      label: "Projects",
      icon: <AiOutlineFolder className="text-lg" />,
      subItems: [
        { label: "Project List", href: "/projects" },
        { label: "New Project", href: "/projects/new" },
      ],
    },
    {
      label: "Settings",
      icon: <AiOutlineSetting className="text-lg" />,
      subItems: [
        { label: "Profile", href: "/settings/profile" },
        { label: "Account", href: "/settings/account" },
      ],
    },
    {
      label: "Logout",
      href: "/logout",
      icon: <FiLogOut className="text-lg" />,
    },
  ], []);

  const isActive = useCallback((href?: string, subItems?: MenuItem['subItems']) => {
    if (href) return pathname.startsWith(href);
    if (subItems) return subItems.some(sub => pathname.startsWith(sub.href));
    return false;
  }, [pathname]);

  const toggleMenu = useCallback((label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  }, []);

  const renderMenuItem = useCallback(
    ({ label, icon, href, subItems }: MenuItem) => {
      const active = isActive(href, subItems);
      const isOpen = openMenus.includes(label);

      return (
        <div key={label} className="mb-2">
          {subItems ? (
            <>
              <button
                onClick={() => toggleMenu(label)}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-colors ${
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
                  <FiChevronDown className="text-sm" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={`submenu-${label}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 mt-1 space-y-1"
                  >
                    {subItems.map(({ label: subLabel, href: subHref }) => (
                      <Link
                        href={subHref}
                        key={subHref}
                        className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                          pathname.startsWith(subHref)
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
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
    },
    [isActive, openMenus, pathname, toggleMenu]
  );

  return (
    <div>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      >
        <AiOutlineMenu className="text-lg" />
        <span className="text-sm font-medium">Menu</span>
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-2 border-t border-gray-200 dark:border-gray-700"
          >
            {menuItems.map(renderMenuItem)}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Menu */}
      <nav className="hidden md:block">
        {menuItems.map(renderMenuItem)}
      </nav>
    </div>
  );
};

export default EnhancedMenu;
