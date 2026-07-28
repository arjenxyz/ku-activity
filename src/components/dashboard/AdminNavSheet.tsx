'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { BrandMark } from '@/components/brand/BrandMark';
import { HonorIconTile } from '@/components/icons/HonorIcons';
import { AdminUiModeToggle } from '@/components/dashboard/AdminUiModeToggle';
import { useAdminUiMode } from '@/hooks/useAdminUiMode';
import { getAdminHubSections } from '@/config/admin-mobile-nav';
import { isMenuPathActive } from '@/config/projectMenu';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { adminHref, getAdminPanelBase } from '@/lib/demo/demo-paths';

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
};

const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 32 } },
  exit: { y: '100%', transition: { duration: 0.22 } },
};

const tileVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.03, type: 'spring' as const, stiffness: 400, damping: 26 },
  }),
};

export function AdminNavSheet({ open, onClose, projectId }: Props) {
  const ui = useRegistryStrings('components/dashboard/AdminNavSheet');
  const navCopy = useRegistryStrings('config/admin-mobile-nav');
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { isSimple } = useAdminUiMode();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sections = useMemo(
    () => getAdminHubSections(projectId, isSimple ? 'simple' : 'advanced', navCopy),
    [projectId, isSimple, navCopy]
  );

  const isActive = (href: string) => {
    const resolved = adminHref(pathname, href);
    if (projectId && href.includes(`/admin-panel/proje/${projectId}`)) {
      return isMenuPathActive(projectId, pathname, resolved);
    }
    if (href === '/admin-panel') return pathname === getAdminPanelBase(pathname);
    return pathname === resolved || pathname.startsWith(`${resolved}/`);
  };

  const navigate = (href: string) => {
    router.push(adminHref(pathname, href));
    onClose();
  };

  let tileIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label={ui.menuAriaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-label={ui.close}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[min(85vh,40rem)] max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl safe-pb"
            style={{ colorScheme: 'light' }}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="shrink-0 border-b border-slate-100 px-5 pb-3 pt-3">
              <div className="mb-3 flex justify-center">
                <span className="h-1 w-12 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BrandMark size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.08em] text-[#0E1548]">{ui.brand}</p>
                    <h2 className="text-lg font-bold text-slate-900">{ui.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AdminUiModeToggle compact />
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                    aria-label={ui.close}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-none p-4" data-allow-scroll>
              {sections.map((section, sectionIdx) => (
                <motion.section
                  key={section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIdx * 0.05 + 0.06 }}
                >
                  <div className="mb-2.5 px-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{section.title}</h3>
                    {section.subtitle ? (
                      <p className="text-[11px] text-slate-400">{section.subtitle}</p>
                    ) : null}
                  </div>
                  <ul className={`grid gap-2.5 ${section.items.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      const i = tileIndex++;
                      return (
                        <li key={item.key}>
                          <motion.button
                            type="button"
                            onClick={() => navigate(item.href)}
                            custom={i}
                            variants={tileVariants}
                            initial="hidden"
                            animate="visible"
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex w-full flex-col items-center gap-2 rounded-2xl border bg-white p-3.5 text-center shadow-sm ${
                              active ? 'border-[#0E1548]/30 ring-2 ring-[#0E1548]/20' : 'border-slate-200/80'
                            }`}
                          >
                            <HonorIconTile name={item.icon.name} theme={item.icon.theme} size="lg" />
                            <span>
                              <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                              {item.hint ? (
                                <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">
                                  {item.hint}
                                </span>
                              ) : null}
                            </span>
                            {active && (
                              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0E1548]" />
                            )}
                          </motion.button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
