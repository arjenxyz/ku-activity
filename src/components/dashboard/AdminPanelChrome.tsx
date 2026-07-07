'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AdminAppBottomNav } from '@/components/dashboard/AdminAppBottomNav';
import { AdminShell } from '@/components/dashboard/AdminShell';
import { AdminTopBar } from '@/components/dashboard/AdminTopBar';
import { AdminSimpleModeGuard } from '@/components/dashboard/AdminSimpleModeGuard';
import { AdminUiModeProvider } from '@/hooks/useAdminUiMode';
import { AdminProjectSettingsProvider } from '@/hooks/useAdminProjectSettings';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { useAdminCurrentProject } from '@/hooks/useAdminCurrentProject';
import type { Project } from '@/types/project';

const PROJECT_ID_RE = /^\/admin-panel\/proje\/([a-f0-9-]{36})/;

function AdminPanelChromeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const projectId = useMemo(() => pathname.match(PROJECT_ID_RE)?.[1] ?? null, [pathname]);
  const { project, setProject } = useAdminCurrentProject(projectId);
  const isProjectRoute = Boolean(projectId);
  const isSettings = pathname.startsWith('/admin-panel/ayarlar');
  const hideGlobalDock = isProjectRoute;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' });
    window.location.href = '/admin-panel/login';
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <AdminTopBar
        onLogout={() => void handleLogout()}
        onProjectSettings={projectId ? () => setSettingsOpen(true) : undefined}
      />
      <div
        className={
          hideGlobalDock
            ? 'pb-0'
            : 'pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-0'
        }
      >
        <AdminShell compact={isSettings}>
          <AdminProjectSettingsProvider openProjectSettings={() => setSettingsOpen(true)}>
            <AdminSimpleModeGuard projectId={projectId}>{children}</AdminSimpleModeGuard>
          </AdminProjectSettingsProvider>
        </AdminShell>
      </div>
      {!hideGlobalDock ? <AdminAppBottomNav /> : null}

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
