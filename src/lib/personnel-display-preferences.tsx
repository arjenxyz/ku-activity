'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'crewledger-personnel-display';

type DisplayPrefs = {
  largeText: boolean;
  highContrast: boolean;
};

const DEFAULT: DisplayPrefs = { largeText: false, highContrast: false };

type ContextValue = DisplayPrefs & {
  setLargeText: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
};

const PersonnelDisplayContext = createContext<ContextValue | null>(null);

function readPrefs(): DisplayPrefs {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      largeText: Boolean(parsed.largeText),
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return DEFAULT;
  }
}

export function PersonnelDisplayProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  const persist = useCallback((next: DisplayPrefs) => {
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      ...prefs,
      setLargeText: (largeText) => persist({ ...prefs, largeText }),
      setHighContrast: (highContrast) => persist({ ...prefs, highContrast }),
    }),
    [prefs, persist]
  );

  const rootClass = [
    prefs.largeText ? 'personnel-large-text' : '',
    prefs.highContrast ? 'personnel-high-contrast' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PersonnelDisplayContext.Provider value={value}>
      <div className={rootClass || undefined}>{children}</div>
    </PersonnelDisplayContext.Provider>
  );
}

export function usePersonnelDisplay() {
  const ctx = useContext(PersonnelDisplayContext);
  if (!ctx) {
    throw new Error('usePersonnelDisplay PersonnelDisplayProvider içinde kullanılmalı');
  }
  return ctx;
}
