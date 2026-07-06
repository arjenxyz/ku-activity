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

type PersonnelTopBarActionsContextValue = {
  enterCode: PersonnelTopBarEnterCodeAction | null;
  setEnterCode: (action: PersonnelTopBarEnterCodeAction | null) => void;
};

const PersonnelTopBarActionsContext = createContext<PersonnelTopBarActionsContextValue | null>(null);

export function PersonnelTopBarActionsProvider({ children }: { children: ReactNode }) {
  const [enterCode, setEnterCodeState] = useState<PersonnelTopBarEnterCodeAction | null>(null);

  const setEnterCode = useCallback((action: PersonnelTopBarEnterCodeAction | null) => {
    setEnterCodeState(action);
  }, []);

  const value = useMemo(
    () => ({
      enterCode,
      setEnterCode,
    }),
    [enterCode, setEnterCode]
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
