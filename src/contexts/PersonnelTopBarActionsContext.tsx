'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type PersonnelTopBarEnterCodeAction = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: 'enter' | 'cancel';
};

export type PersonnelTopBarLogoutAction = {
  label: string;
  onClick: () => void;
};

type PersonnelTopBarActionsContextValue = {
  enterCode: PersonnelTopBarEnterCodeAction | null;
  setEnterCode: (action: PersonnelTopBarEnterCodeAction | null) => void;
  logout: PersonnelTopBarLogoutAction | null;
  setLogout: (action: PersonnelTopBarLogoutAction | null) => void;
};

const PersonnelTopBarActionsContext = createContext<PersonnelTopBarActionsContextValue | null>(null);

export function PersonnelTopBarActionsProvider({ children }: { children: ReactNode }) {
  const [enterCode, setEnterCodeState] = useState<PersonnelTopBarEnterCodeAction | null>(null);
  const [logout, setLogoutState] = useState<PersonnelTopBarLogoutAction | null>(null);

  const setEnterCode = useCallback((action: PersonnelTopBarEnterCodeAction | null) => {
    setEnterCodeState(action);
  }, []);

  const setLogout = useCallback((action: PersonnelTopBarLogoutAction | null) => {
    setLogoutState(action);
  }, []);

  const value = useMemo(
    () => ({
      enterCode,
      setEnterCode,
      logout,
      setLogout,
    }),
    [enterCode, setEnterCode, logout, setLogout]
  );

  return (
    <PersonnelTopBarActionsContext.Provider value={value}>
      {children}
    </PersonnelTopBarActionsContext.Provider>
  );
}

export function usePersonnelTopBarEnterCodeAction() {
  return useContext(PersonnelTopBarActionsContext);
}

export function useRegisterPersonnelTopBarEnterCode(action: PersonnelTopBarEnterCodeAction | null) {
  const ctx = usePersonnelTopBarEnterCodeAction();

  useEffect(() => {
    if (!ctx) return;
    ctx.setEnterCode(action);
    return () => ctx.setEnterCode(null);
  }, [ctx, action]);
}

export function useRegisterPersonnelTopBarLogout(action: PersonnelTopBarLogoutAction | null) {
  const ctx = usePersonnelTopBarEnterCodeAction();

  useEffect(() => {
    if (!ctx) return;
    ctx.setLogout(action);
    return () => ctx.setLogout(null);
  }, [ctx, action]);
}
