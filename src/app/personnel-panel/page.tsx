'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiList,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiXCircle,
} from 'react-icons/fi';
import { PersonnelOverviewHeader } from '@/components/personnel/PersonnelOverviewHeader';
import { PersonnelNetHero } from '@/components/personnel/PersonnelNetHero';
import { PersonnelCalendar } from '@/components/personnel/PersonnelCalendar';
import { PersonnelMesaiPanel } from '@/components/personnel/PersonnelMesaiPanel';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelPayrollPrint } from '@/components/personnel/PersonnelPayrollPrint';
import { PersonnelSettingsPage } from '@/components/personnel/PersonnelSettingsPage';
import { PersonnelRightsPanel } from '@/components/personnel/PersonnelRightsPanel';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelStatGrid } from '@/components/personnel/PersonnelStatGrid';
import { PersonnelOverviewStrip } from '@/components/personnel/PersonnelOverviewStrip';
import { PersonnelTabNav } from '@/components/personnel/PersonnelTabNav';
import { PersonnelSection } from '@/components/personnel/PersonnelRecordCard';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelAsgariPanel } from '@/components/personnel/PersonnelAsgariPanel';
import { PersonnelQuickActions } from '@/components/personnel/PersonnelQuickActions';
import { PersonnelPullToRefresh } from '@/components/personnel/PersonnelPullToRefresh';
import { PersonnelPwaInstallBanner } from '@/components/personnel/PersonnelPwaInstallBanner';
import { PersonnelTrustFooter } from '@/components/personnel/PersonnelTrustFooter';
import { PersonnelWorkLogItem } from '@/components/personnel/PersonnelWorkLogItem';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { usePersonnelAsgari } from '@/hooks/usePersonnelAsgari';
import { usePersonnelTab, type PersonnelTabId } from '@/hooks/usePersonnelTab';
import { formatMoney } from '@/lib/format';
import { buildMonthCalendar, computeMesaiStats, currentMonth, getMesaiCountLines, getWorkDayCountLines } from '@/lib/personnel-stats';

const DESKTOP_TABS = [
  { id: 'overview', label: 'Özet', icon: <FiList className="w-4 h-4" /> },
  { id: 'work', label: 'Yevmiye', icon: <FiBriefcase className="w-4 h-4" /> },
  { id: 'mesai', label: 'Mesai', icon: <FiClock className="w-4 h-4" /> },
  { id: 'asgari', label: 'Asgari', icon: <FiShield className="w-4 h-4" /> },
  { id: 'finance', label: 'Finans', icon: <FiDollarSign className="w-4 h-4" /> },
  { id: 'rights', label: 'Haklarım', icon: <FiBookOpen className="w-4 h-4" /> },
  { id: 'settings', label: 'Ayarlar', icon: <FiSettings className="w-4 h-4" /> },
];

function PersonelPanelContent() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const { activeTab, setActiveTab } = usePersonnelTab('overview');
  const loadFinance = activeTab === 'overview' || activeTab === 'finance';
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
  const calendarDays = buildMonthCalendar(month, workLogs);
  const mesaiStats = employee ? computeMesaiStats(workLogs, Number(employee.daily_wage)) : null;

  const workDayLines = getWorkDayCountLines(workLogs);
  const mesaiLines = mesaiStats
    ? getMesaiCountLines(mesaiStats)
    : [
        { count: 0, label: 'Tam mesai' },
        { count: 0, label: 'Çeyrek mesai' },
        { count: 0, label: 'Yarım mesai' },
      ];

  const statItems = stats
    ? [
        {
          label: 'Brüt Kazanç',
          value: formatMoney(stats.gross),
          icon: <FiTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
          accent: 'bg-green-400',
          iconWrap: 'bg-green-50 dark:bg-green-900/30',
        },
        {
          label: 'Toplam Avans',
          value: formatMoney(stats.totalAdvance),
          icon: <FiCreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          accent: 'bg-amber-400',
          iconWrap: 'bg-amber-50 dark:bg-amber-900/30',
        },
        {
          label: 'Kesinti',
          value: formatMoney(stats.totalDeduct),
          icon: <FiXCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
          accent: 'bg-red-400',
          iconWrap: 'bg-red-50 dark:bg-red-900/30',
        },
        {
          label: 'Net Maaş',
          value: formatMoney(stats.net),
          icon: <FiDollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          accent: 'bg-indigo-400',
          iconWrap: 'bg-indigo-50 dark:bg-indigo-900/30',
        },
      ]
    : [];

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Verileriniz yükleniyor…</p>
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

    if (activeTab === 'work') {
      return (
        <div className="space-y-6">
          <PersonnelCalendar month={month} onMonthChange={setMonth} days={calendarDays} />

          <PersonnelSection
            title={`Yevmiye Kayıtları · ${new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`}
            icon={<FiBriefcase className="w-5 h-5 text-green-600" />}
            isEmpty={workLogs.length === 0}
          >
            <div>
              {workLogs.map((r) => (
                <PersonnelWorkLogItem key={r.id} log={r} />
              ))}
            </div>
          </PersonnelSection>
        </div>
      );
    }

    if (activeTab === 'mesai' && employee) {
      return (
        <PersonnelMesaiPanel
          month={month}
          onMonthChange={setMonth}
          workLogs={workLogs}
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
          <p className="text-sm text-gray-500">Yükleniyor…</p>
        </div>
      );
    }

    if (activeTab === 'finance' && !stats) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Finans verileri yükleniyor…</p>
        </div>
      );
    }

    const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="space-y-4 sm:space-y-5">
        {employee && (
          <PersonnelOverviewHeader
            firstName={employee.name.split(' ')[0]}
            fullName={employee.name}
            position={employee.position}
            photoUrl={employee.photo_url}
            dailyWage={Number(employee.daily_wage)}
            month={month}
            onMonthChange={setMonth}
          />
        )}

        <PersonnelTodayAttendance />

        {stats && (
          <PersonnelNetHero
            net={stats.net}
            gross={stats.gross}
            totalAdvance={stats.totalAdvance}
            totalDeduct={stats.totalDeduct}
            monthLabel={monthLabel}
            onOpenFinance={() => goTab('finance')}
          />
        )}

        <PersonnelQuickActions onNavigate={goTab} />

        <div className="sm:hidden">
          <PersonnelPwaInstallBanner />
        </div>

        {stats && (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:block">
              Dönem özeti
            </p>
            <PersonnelStatGrid items={statItems} />
            <div className="grid sm:grid-cols-2 gap-3">
              <PersonnelOverviewStrip
                title="Çalışılan gün"
                icon={<FiCalendar className="w-4 h-4" />}
                iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                lines={workDayLines}
                onOpen={() => goTab('work')}
              />
              <PersonnelOverviewStrip
                title="Mesai dağılımı"
                icon={<FiClock className="w-4 h-4" />}
                iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                lines={mesaiLines}
                formatLineLabel={(label) => label.replace(' mesai', '')}
                onOpen={() => goTab('mesai')}
              />
            </div>
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
            <div className="mb-4 sm:mb-5 no-print hidden sm:block">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Puantaj, yoklama ve maaş özeti
              </p>
            </div>

            <div className="mb-4 sm:mb-6 no-print hidden sm:block">
              <PersonnelPwaInstallBanner />
            </div>

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
