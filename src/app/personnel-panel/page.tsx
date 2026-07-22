'use client';


import { Suspense, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import {
  FiBriefcase,
  FiDollarSign,
  FiList,
  FiSettings,
} from 'react-icons/fi';
import { PersonnelNetHero } from '@/components/personnel/PersonnelNetHero';
import { PersonnelUnifiedCalendarPanel } from '@/components/personnel/PersonnelUnifiedCalendarPanel';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelPayrollPrint } from '@/components/personnel/PersonnelPayrollPrint';
import { PersonnelSettingsPage } from '@/components/personnel/PersonnelSettingsPage';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelTabNav } from '@/components/personnel/PersonnelTabNav';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelPullToRefresh } from '@/components/personnel/PersonnelPullToRefresh';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { usePersonnelTab, type PersonnelTabId } from '@/hooks/usePersonnelTab';
import { currentMonth } from '@/lib/personnel-stats';

function PersonelPanelContent() {
  const strings = useRegistryStrings('app/personnel-panel/page');
  const DESKTOP_TABS = [
    { id: 'overview', label: strings.tabs.overview, icon: <FiList className="w-4 h-4" /> },
    { id: 'work', label: strings.tabs.work, icon: <FiBriefcase className="w-4 h-4" /> },
    { id: 'finance', label: strings.tabs.finance, icon: <FiDollarSign className="w-4 h-4" /> },
    { id: 'settings', label: strings.tabs.settings, icon: <FiSettings className="w-4 h-4" /> },
  ];
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const { activeTab, setActiveTab } = usePersonnelTab('overview');
  const loadFinance = activeTab === 'overview' || activeTab === 'finance' || activeTab === 'work';
  const { employee, workLogs, deductions, minimumWages, stats, loading, error, reload } =
    usePersonnelDashboard(month, { loadFinance });

  const handleLogout = async () => {
    await fetch('/api/auth/personnel/logout', { method: 'POST' });
    router.replace('/personnel-panel/login');
    router.refresh();
  };

  const advances = deductions.filter((d) => d.type === 'advance');
  const otherDeductions = deductions.filter((d) => d.type !== 'advance');
  const tabsWithBadges = DESKTOP_TABS.map((tab) => ({ ...tab }));

  const handlePrint = () => {
    window.print();
  };

  const goTab = (id: string) => setActiveTab(id as PersonnelTabId);
  const isWorkTab = activeTab === 'work';

  useEffect(() => {
    if (!isWorkTab) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isWorkTab]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{strings.loadingData}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      );
    }

    if (activeTab === 'work' && employee) {
      return (
        <div className="w-full max-h-full overflow-hidden">
          <PersonnelUnifiedCalendarPanel
            month={month}
            onMonthChange={setMonth}
            workLogs={workLogs}
            deductions={deductions}
            minimumWages={minimumWages}
            dailyWage={Number(employee.daily_wage)}
          />
        </div>
      );
    }

    if (activeTab === 'finance' && stats && employee) {
      return (
        <div className="max-w-lg mx-auto w-full">
          <PersonnelFinancePanel stats={stats} onPrint={handlePrint} />
        </div>
      );
    }

    if (activeTab === 'settings' && employee) {
      return (
        <PersonnelSettingsPage employee={employee} onLogout={() => void handleLogout()} />
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{strings.loading}</p>
        </div>
      );
    }

    if (activeTab === 'finance' && !stats) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{strings.loadingFinance}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-5">
        {employee && stats && (
          <PersonnelNetHero
            fullName={employee.name}
            position={employee.position}
            photoUrl={employee.photo_url}
            net={stats.net}
            gross={stats.gross}
            totalAdvance={stats.totalAdvance}
            totalDeduct={stats.totalDeduct}
            month={month}
            onMonthChange={setMonth}
            onOpenFinance={() => goTab('finance')}
          />
        )}

        <PersonnelTodayAttendance />

      </div>
    );
  };

  return (
    <>
      <PersonnelShell settingsMode={activeTab === 'settings'} centeredViewport={isWorkTab}>
        <PersonnelPullToRefresh
          className={isWorkTab ? 'flex h-full w-full flex-col justify-center' : undefined}
          onRefresh={async () => {
            await reload();
          }}
        >
          <div className={`no-print ${isWorkTab ? 'w-full' : ''}`}>
            <div className="mb-4 sm:mb-6 no-print hidden sm:block">
              <PersonnelTabNav tabs={tabsWithBadges} active={activeTab} onChange={goTab} />
            </div>
            {renderContent()}
          </div>
        </PersonnelPullToRefresh>
      </PersonnelShell>

      {activeTab === 'finance' && employee && stats && (
        <PersonnelPayrollPrint
          employee={employee}
          month={month}
          stats={stats}
          workLogs={workLogs}
          advances={advances}
          otherDeductions={otherDeductions}
          minimumWages={minimumWages}
        />
      )}
    </>
  );
}

export default function PersonelPanel() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PersonelPanelContent />
    </Suspense>
  );
}
