'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getRecentBrowserErrors, installSupportConsoleBuffer } from '@/lib/support-console-buffer';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type AuthReportContextValue = {
  formError?: string;
  setFormError: (message?: string) => void;
  getReportPayload: () => {
    formError?: string;
    diagnostics: string[];
    pageUrl: string;
    userAgent: string;
    capturedAt: string;
  };
};

const AuthReportContext = createContext<AuthReportContextValue | null>(null);

const diagnostics: string[] = [];
const MAX_DIAG = 8;

export function pushAuthDiagnostic(message: string) {
  diagnostics.unshift(`${new Date().toISOString()} — ${message}`);
  if (diagnostics.length > MAX_DIAG) diagnostics.length = MAX_DIAG;
}

export function AuthReportProvider({ children }: { children: React.ReactNode }) {
  const [formError, setFormErrorState] = useState<string | undefined>();

  useEffect(() => {
    installSupportConsoleBuffer();
  }, []);

  const setFormError = useCallback((message?: string) => {
    setFormErrorState(message?.trim() || undefined);
    if (message?.trim()) {
      pushAuthDiagnostic(`Form: ${message.trim()}`);
    }
  }, []);

  const getReportPayload = useCallback(
    () => ({
      formError,
      diagnostics: [...new Set([...diagnostics, ...getRecentBrowserErrors()])].slice(0, 12),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      capturedAt: new Date().toISOString(),
    }),
    [formError]
  );

  const value = useMemo(
    () => ({ formError, setFormError, getReportPayload }),
    [formError, setFormError, getReportPayload]
  );

  return <AuthReportContext.Provider value={value}>{children}</AuthReportContext.Provider>;
}

export function useAuthReport() {
  const strings = useRegistryStrings('components/auth/AuthReportContext');
  const ctx = useContext(AuthReportContext);
  if (!ctx) {
    throw new Error(strings.providerError);
  }
  return ctx;
}
