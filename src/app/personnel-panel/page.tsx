'use client';


import { Suspense, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiList,
  FiSettings,
  FiShield,
} from 'react-icons/fi';
import { PersonnelNetHero } from '@/components/personnel/PersonnelNetHero';
import { PersonnelUnifiedCalendarPanel } from '@/components/personnel/PersonnelUnifiedCalendarPanel';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelPayrollPrint } from '@/components/personnel/PersonnelPayrollPrint';
import { PersonnelSettingsPage } from '@/components/personnel/PersonnelSettingsPage';
import { PersonnelRightsPanel } from '@/components/personnel/PersonnelRightsPanel';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelOverviewStrip } from '@/components/personnel/PersonnelOverviewStrip';
import { PersonnelTabNav } from '@/components/personnel/PersonnelTabNav';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelAsgariPanel } from '@/components/personnel/PersonnelAsgariPanel';
import { PersonnelPullToRefresh } from '@/components/personnel/PersonnelPullToRefresh';
import { PersonnelTrustFooter } from '@/components/personnel/PersonnelTrustFooter';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { usePersonnelAsgari } from '@/hooks/usePersonnelAsgari';
import { usePersonnelTab, type PersonnelTabId } from '@/hooks/usePersonnelTab';
import { computeMesaiStats, currentMonth, getWorkDayCountLines } from '@/lib/personnel-stats';
import { formatMoney } from '@/lib/format';

function PersonelPanelContent() {
  const strings = useRegistryStrings('app/personnel-panel/page');
  const DESKTOP_TABS = [
    { id: 'overview', label: strings.tabs.overview, icon: <FiList className="w-4 h-4" /> },
    { id: 'work', label: strings.tabs.work, icon: <FiBriefcase className="w-4 h-4" /> },
    { id: 'asgari', label: strings.tabs.asgari, icon: <FiShield className="w-4 h-4" /> },
    { id: 'finance', label: strings.tabs.finance, icon: <FiDollarSign className="w-4 h-4" /> },
    { id: 'rights', label: strings.tabs.rights, icon: <FiBookOpen className="w-4 h-4" /> },
    { id: 'settings', label: strings.tabs.settings, icon: <FiSettings className="w-4 h-4" /> },
  ];
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const { activeTab, setActiveTab } = usePersonnelTab('overview');
  const loadFinance = activeTab === 'overview' || activeTab === 'finance' || activeTab === 'work';
  const loadAsgari = activeTab === 'asgari';
  const { employee, workLogs, deductions, minimumWages, stats, loading, error, reload } =
    usePersonnelDashboard(month, { loadFinance });
  const {
    data: asgariData,
    loading: asgariLoading,
    error: asgariError,
    reload: reloadAsgari,
  } = usePersonnelAsgari(month, loadAsgari);

  const handleLogout = async () => {
    await fetch('/api/auth/personnel/logout', { method: 'POST' });
    router.replace('/personnel-panel/login');
    router.refresh();
  };

  const advances = deductions.filter((d) => d.type === 'advance');
  const otherDeductions = deductions.filter((d) => d.type !== 'advance');
  const mesaiStats = employee ? computeMesaiStats(workLogs, Number(employee.daily_wage)) : null;

  const workDayLines = getWorkDayCountLines(workLogs);
  const calendarSummaryLines = mesaiStats
    ? [
        ...workDayLines,
        {
          count: mesaiStats.recordCount,
          label: strings.mesaiDistributionTitle,
          display: formatMoney(mesaiStats.totalPay),
        },
      ]
    : workDayLines;

  const tabsWithBadges = DESKTOP_TABS.map((tab) => ({
    ...tab,
    badge:
      tab.id === 'asgari' &&
      asgariData?.gap.paymentStatus &&
      (asgariData.gap.paymentStatus === 'open' || asgariData.gap.paymentStatus === 'partial')
        ? 1
        : undefined,
  }));

  const handlePrint = () => {
    window.print();
  };

  const goTab = (id: string) => setActiveTab(id as PersonnelTabId);

  const renderContent = () => {
    if (loading && activeTab !== 'asgari') {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{strings.loadingData}</p>
        </div>
      );
    }

    if (error && activeTab !== 'asgari') {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-6 text-center">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      );
    }

    if (activeTab === 'work' && employee) {
      return (
        <PersonnelUnifiedCalendarPanel
          month={month}
          onMonthChange={setMonth}
          workLogs={workLogs}
          deductions={deductions}
          minimumWages={minimumWages}
          dailyWage={Number(employee.daily_wage)}
        />
      );
    }

    if (activeTab === 'asgari') {
      return (
        <PersonnelAsgariPanel
          month={month}
          onMonthChange={setMonth}
          data={asgariData}
          loading={asgariLoading}
          error={asgariError}
          onRetry={() => void reloadAsgari()}
        />
      );
    }

    if (activeTab === 'finance' && stats && employee) {
      return (
        <div className="max-w-lg mx-auto w-full">
          <PersonnelFinancePanel stats={stats} onPrint={handlePrint} />
        </div>
      );
    }

    if (activeTab === 'rights') {
      return <PersonnelRightsPanel />;
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

        {stats && (
          <div className="grid sm:grid-cols-2 gap-3">
            <PersonnelOverviewStrip
              title={strings.workDaysTitle}
              icon={<FiCalendar className="w-4 h-4" />}
              iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
              lines={calendarSummaryLines}
              onOpen={() => goTab('work')}
            />
          </div>
        )}

        <PersonnelTrustFooter
          managerPhone={employee?.manager?.phone}
          managerName={employee?.manager?.name}
        />
      </div>
    );
  };

  return (
    <>
      <PersonnelShell>
        <PersonnelPullToRefresh
          onRefresh={async () => {
            await reload();
            if (loadAsgari) await reloadAsgari();
          }}
        >
          <div className="no-print">
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
