'use client';


import { Suspense, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import { FiBriefcase, FiDollarSign, FiList, FiSettings } from 'react-icons/fi';
import { PersonnelNetHero } from '@/components/personnel/PersonnelNetHero';
import { PersonnelUnifiedCalendarPanel } from '@/components/personnel/PersonnelUnifiedCalendarPanel';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelPayrollPrint } from '@/components/personnel/PersonnelPayrollPrint';
import { PersonnelSettingsPage } from '@/components/personnel/PersonnelSettingsPage';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelPullToRefresh } from '@/components/personnel/PersonnelPullToRefresh';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { usePersonnelTab, type PersonnelTabId } from '@/hooks/usePersonnelTab';
import { formatMoney } from '@/lib/format';
import { currentMonth } from '@/lib/personnel-stats';
import { isPersonnelDemoMode } from '@/lib/demo/demo-paths';

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
  const { employee, workLogs, absenceDates, deductions, minimumWages, stats, loading, error, reload } =
    usePersonnelDashboard(month, { loadFinance });

  const handleLogout = async () => {
    if (!isPersonnelDemoMode()) {
      await fetch('/api/auth/personnel/logout', { method: 'POST' });
    }
    router.replace('/personnel-panel/login');
    router.refresh();
  };

  const advances = deductions.filter((d) => d.type === 'advance');
  const otherDeductions = deductions.filter((d) => d.type !== 'advance');

  const handlePrint = () => {
    window.print();
  };

  const goTab = (id: string) => setActiveTab(id as PersonnelTabId);
  const isWorkTab = activeTab === 'work';
  const isOverviewTab = activeTab === 'overview';

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
            hireDate={employee.hire_date}
            absenceDates={absenceDates}
          />
        </div>
      );
    }

    if (activeTab === 'finance' && stats && employee) {
      return (
        <div className="mx-auto w-full sm:max-w-3xl">
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

    if (employee && stats) {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
            <div className="xl:col-span-9">
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
            </div>
            <div className="xl:col-span-3">
              <PersonnelTodayAttendance />
            </div>
          </div>
        </div>
      );
    }

    return <PersonnelTodayAttendance />;
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
            {isWorkTab ? (
              renderContent()
            ) : (
              <>
                <div className="hidden sm:grid sm:grid-cols-12 sm:gap-5">
                  <aside className="sm:col-span-4 lg:col-span-3">
                    <div className="sticky top-[calc(var(--personnel-topbar-h)+1rem)] space-y-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      {employee ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                          <p className="truncate text-base font-bold text-[#0E1548] dark:text-white">
                            {employee.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {employee.position || strings.tabs.overview}
                          </p>
                        </div>
                      ) : null}
                      <nav className="space-y-1.5">
                        {DESKTOP_TABS.map((tab) => {
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => goTab(tab.id)}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                                isActive
                                  ? 'bg-[#0E1548] text-white shadow-md shadow-[#0E1548]/20'
                                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              {tab.icon}
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                      {isOverviewTab && stats ? (
                        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Net</p>
                            <p className="text-sm font-semibold text-[#0E1548] dark:text-white">
                              {formatMoney(stats.net)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Brut</p>
                            <p className="text-sm font-semibold text-[#0E1548] dark:text-white">
                              {formatMoney(stats.gross)}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </aside>
                  <section className="sm:col-span-8 lg:col-span-9">{renderContent()}</section>
                </div>
                <div className="sm:hidden">{renderContent()}</div>
              </>
            )}
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
