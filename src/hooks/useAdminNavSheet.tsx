'use client';

import { createContext, useContext } from 'react';

type AdminNavSheetContextValue = {
  open: () => void;
};

const AdminNavSheetContext = createContext<AdminNavSheetContextValue | null>(null);

export function AdminNavSheetProvider({
  children,
  open,
}: {
  children: React.ReactNode;
  open: () => void;
}) {
  return (
    <AdminNavSheetContext.Provider value={{ open }}>{children}</AdminNavSheetContext.Provider>
  );
}

export function useAdminNavSheet() {
  return useContext(AdminNavSheetContext);
}
