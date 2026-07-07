'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export type PersonnelThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'crewledger-personnel-theme';
const DEFAULT_MODE: PersonnelThemeMode = 'light';

type ContextValue = {
  mode: PersonnelThemeMode;
  effective: 'light' | 'dark';
  setMode: (mode: PersonnelThemeMode) => void;
};

const PersonnelThemeContext = createContext<ContextValue | null>(null);

export function resolveEffectiveTheme(mode: PersonnelThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') return mode === 'dark' ? 'dark' : 'light';
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function applyPersonnelTheme(effective: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', effective === 'dark');
}

function readMode(): PersonnelThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    // Eski global theme anahtarından taşı
    const legacy = localStorage.getItem('theme');
    if (legacy === 'dark') return 'dark';
    if (legacy === 'light') return 'light';
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

export function PersonnelThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PersonnelThemeMode>(DEFAULT_MODE);
  const [effective, setEffective] = useState<'light' | 'dark'>('light');

  const apply = useCallback((nextMode: PersonnelThemeMode) => {
    const nextEffective = resolveEffectiveTheme(nextMode);
    setEffective(nextEffective);
    applyPersonnelTheme(nextEffective);
  }, []);

  useEffect(() => {
    const initial = readMode();
    setModeState(initial);
    apply(initial);
  }, [apply]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode, apply]);

  const setMode = useCallback(
    (next: PersonnelThemeMode) => {
      setModeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      apply(next);
    },
    [apply]
  );

  const value = useMemo(
    () => ({ mode, effective, setMode }),
    [mode, effective, setMode]
  );

  return <PersonnelThemeContext.Provider value={value}>{children}</PersonnelThemeContext.Provider>;
}

export function usePersonnelTheme() {
  const strings = useRegistryStrings('lib/personnel-theme');
  const ctx = useContext(PersonnelThemeContext);
  if (!ctx) throw new Error(strings.providerError);
  return ctx;
}
