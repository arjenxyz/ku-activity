'use client';

import { createContext, useContext } from 'react';

type AdminProjectSettingsContextValue = {
  openProjectSettings: () => void;
};

const AdminProjectSettingsContext = createContext<AdminProjectSettingsContextValue | null>(
  null
);

export function AdminProjectSettingsProvider({
  children,
  openProjectSettings,
}: {
  children: React.ReactNode;
  openProjectSettings: () => void;
}) {
  return (
    <AdminProjectSettingsContext.Provider value={{ openProjectSettings }}>
      {children}
    </AdminProjectSettingsContext.Provider>
  );
}

export function useAdminProjectSettings() {
  return useContext(AdminProjectSettingsContext);
}
