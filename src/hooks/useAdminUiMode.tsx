'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type AdminUiMode,
  readAdminUiMode,
  writeAdminUiMode,
} from '@/lib/admin-ui-mode';

type AdminUiModeContextValue = {
  mode: AdminUiMode;
  setMode: (mode: AdminUiMode) => void;
  isSimple: boolean;
  isAdvanced: boolean;
  ready: boolean;
};

const AdminUiModeContext = createContext<AdminUiModeContextValue | null>(null);

export function AdminUiModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AdminUiMode>('simple');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(readAdminUiMode());
    setReady(true);
  }, []);

  const setMode = useCallback((next: AdminUiMode) => {
    setModeState(next);
    writeAdminUiMode(next);
  }, []);

  return (
    <AdminUiModeContext.Provider
      value={{
        mode,
        setMode,
        isSimple: mode === 'simple',
        isAdvanced: mode === 'advanced',
        ready,
      }}
    >
      {children}
    </AdminUiModeContext.Provider>
  );
}

export function useAdminUiMode() {
  const ctx = useContext(AdminUiModeContext);
  if (!ctx) {
    throw new Error('useAdminUiMode AdminUiModeProvider içinde kullanılmalı');
  }
  return ctx;
}

export function useAdminUiModeOptional() {
  return useContext(AdminUiModeContext);
}
