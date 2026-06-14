'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const PERSONNEL_TABS = ['overview', 'work', 'mesai', 'asgari', 'finance', 'rights', 'settings'] as const;
export type PersonnelTabId = (typeof PERSONNEL_TABS)[number];

function isValidTab(value: string | null): value is PersonnelTabId {
  return PERSONNEL_TABS.includes(value as PersonnelTabId);
}

export function usePersonnelTab(defaultTab: PersonnelTabId = 'overview') {
  const router = useRouter();
  const searchParams = useSearchParams();
  const param = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState<PersonnelTabId>(
    isValidTab(param) ? param : defaultTab
  );

  useEffect(() => {
    if (isValidTab(param) && param !== activeTab) {
      setActiveTabState(param);
    }
  }, [param, activeTab]);

  const setActiveTab = useCallback(
    (tab: PersonnelTabId) => {
      setActiveTabState(tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  return { activeTab, setActiveTab };
}
