'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminNavSheet } from '@/components/dashboard/AdminNavSheet';
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AdminTopBar } from '@/components/dashboard/AdminTopBar';
import { AdminSimpleModeGuard } from '@/components/dashboard/AdminSimpleModeGuard';
import { AdminUiModeProvider } from '@/hooks/useAdminUiMode';
import { AdminProjectSettingsProvider } from '@/hooks/useAdminProjectSettings';
import { AdminNavSheetProvider } from '@/hooks/useAdminNavSheet';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { useAdminCurrentProject } from '@/hooks/useAdminCurrentProject';
import type { Project } from '@/types/project';
import { AdminDemoBanner } from '@/components/personnel/PersonnelDemoBanner';
import { isAdminDemoPath, isAdminDemoMode } from '@/lib/demo/demo-paths';

const PROJECT_ID_RE = /^\/admin-panel(?:\/demo)?\/proje\/([a-zA-Z0-9_-]+)/;

function AdminPanelChromeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const projectId = useMemo(() => pathname.match(PROJECT_ID_RE)?.[1] ?? null, [pathname]);
  const { project, setProject } = useAdminCurrentProject(projectId);
  const isSettings = pathname.includes('/ayarlar');
  const isDemo = isAdminDemoPath(pathname);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  useEffect(() => {
    setNavSheetOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (!isAdminDemoMode()) {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
    }
    window.location.href = '/admin-panel/login';
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50">
      {isDemo ? <AdminDemoBanner /> : null}
      <AdminTopBar
        onLogout={() => void handleLogout()}
        onOpenMenu={projectId ? undefined : () => setNavSheetOpen(true)}
        onProjectSettings={projectId ? () => setSettingsOpen(true) : undefined}
      />
      <div className="pb-0">
        <AdminShell compact={isSettings}>
          <AdminProjectSettingsProvider openProjectSettings={() => setSettingsOpen(true)}>
            <AdminNavSheetProvider open={() => setNavSheetOpen(true)}>
              <AdminSimpleModeGuard projectId={projectId}>{children}</AdminSimpleModeGuard>
            </AdminNavSheetProvider>
          </AdminProjectSettingsProvider>
        </AdminShell>
      </div>

      <AdminNavSheet
        open={navSheetOpen}
        onClose={() => setNavSheetOpen(false)}
        projectId={projectId}
      />

      {project && (
        <ProjectSettingsModal
          project={project}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdate={(updated: Project) => setProject(updated)}
        />
      )}
    </div>
  );
}

export function AdminPanelChrome({ children }: { children: React.ReactNode }) {
  return (
    <AdminUiModeProvider>
      <AdminPanelChromeInner>{children}</AdminPanelChromeInner>
    </AdminUiModeProvider>
  );
}
