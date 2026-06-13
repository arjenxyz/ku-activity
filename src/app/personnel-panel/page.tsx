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
  FiLogOut,
  FiSettings,
  FiTrendingUp,
} from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelCalendar } from '@/components/personnel/PersonnelCalendar';
import { PersonnelAlertBar } from '@/components/personnel/PersonnelAlertBar';
import { PersonnelMesaiPanel } from '@/components/personnel/PersonnelMesaiPanel';
import { PersonnelPendingApprovals } from '@/components/personnel/PersonnelPendingApprovals';
import { PersonnelProjectCard } from '@/components/personnel/PersonnelProjectCard';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelContractsSection } from '@/components/personnel/PersonnelContractsSection';
import { PersonnelPasswordForm } from '@/components/personnel/PersonnelPasswordForm';
import { PersonnelRightsPanel } from '@/components/personnel/PersonnelRightsPanel';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelStatGrid } from '@/components/personnel/PersonnelStatGrid';
import { PersonnelTabNav } from '@/components/personnel/PersonnelTabNav';
import { PersonnelSection } from '@/components/personnel/PersonnelRecordCard';
import { PersonnelFinancePanel } from '@/components/personnel/PersonnelFinancePanel';
import { PersonnelBottomNav } from '@/components/personnel/PersonnelBottomNav';
import { PersonnelPullToRefresh } from '@/components/personnel/PersonnelPullToRefresh';
import { PersonnelPwaInstallBanner } from '@/components/personnel/PersonnelPwaInstallBanner';
import { PersonnelDisplaySettings } from '@/components/personnel/PersonnelDisplaySettings';
import { PersonnelWorkLogItem } from '@/components/personnel/PersonnelWorkLogItem';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { usePersonnelTab, type PersonnelTabId } from '@/hooks/usePersonnelTab';
import { formatDate, formatMoney } from '@/lib/format';
import { getWorkLogApprovalStatus } from '@/lib/work-log';
import { buildMonthCalendar, currentMonth } from '@/lib/personnel-stats';

const DESKTOP_TABS = [
  { id: 'overview', label: 'Özet', icon: <FiList className="w-4 h-4" /> },
  { id: 'work', label: 'Yevmiye', icon: <FiBriefcase className="w-4 h-4" /> },
  { id: 'mesai', label: 'Mesai', icon: <FiClock className="w-4 h-4" /> },
  { id: 'finance', label: 'Finans', icon: <FiDollarSign className="w-4 h-4" /> },
  { id: 'rights', label: 'Haklarım', icon: <FiBookOpen className="w-4 h-4" /> },
  { id: 'settings', label: 'Ayarlar', icon: <FiSettings className="w-4 h-4" /> },
];

const MOBILE_TABS = [
  { id: 'overview', label: 'Özet', icon: <FiList /> },
  { id: 'work', label: 'Yevmiye', icon: <FiBriefcase /> },
  { id: 'mesai', label: 'Mesai', icon: <FiClock /> },
  { id: 'finance', label: 'Finans', icon: <FiDollarSign /> },
  { id: 'rights', label: 'Haklar', icon: <FiBookOpen /> },
  { id: 'settings', label: 'Ayarlar', icon: <FiSettings /> },
];

function PersonelPanelContent() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const { activeTab, setActiveTab } = usePersonnelTab('overview');
  const loadFinance = activeTab === 'overview' || activeTab === 'finance';
  const { employee, workLogs, deductions, minimumWages, stats, loading, error, reload } =
    usePersonnelDashboard(month, { loadFinance });

  const pendingEmployeeCount = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_employee'
  ).length;
  const pendingAdminCount = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_admin'
  ).length;

  const handleLogout = async () => {
    await fetch('/api/auth/personnel/logout', { method: 'POST' });
    router.replace('/personnel-panel/login');
    router.refresh();
  };

  const advances = deductions.filter((d) => d.type === 'advance');
  const otherDeductions = deductions.filter((d) => d.type !== 'advance');
  const calendarDays = buildMonthCalendar(month, workLogs);

  const statItems = stats
    ? [
        {
          label: 'Çalışılan Gün',
          value: stats.workDays.toString(),
          icon: <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          accent: 'bg-blue-50 dark:bg-blue-900/30',
        },
        {
          label: 'Brüt Kazanç',
          value: formatMoney(stats.gross),
          icon: <FiTrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
          accent: 'bg-green-50 dark:bg-green-900/30',
        },
        {
          label: 'Toplam Avans',
          value: formatMoney(stats.totalAdvance),
          icon: <FiCreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          accent: 'bg-amber-50 dark:bg-amber-900/30',
        },
        {
          label: 'Net Maaş',
          value: formatMoney(stats.net),
          icon: <FiDollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          accent: 'bg-indigo-50 dark:bg-indigo-900/30',
        },
      ]
    : [];

  const tabsWithBadges = DESKTOP_TABS.map((tab) => ({
    ...tab,
    badge: tab.id === 'work' && pendingEmployeeCount > 0 ? pendingEmployeeCount : undefined,
  }));

  const mobileTabsWithBadges = MOBILE_TABS.map((tab) => ({
    ...tab,
    badge: tab.id === 'work' && pendingEmployeeCount > 0 ? pendingEmployeeCount : undefined,
  }));

  const handlePrint = () => {
    window.print();
  };

  const goTab = (id: string) => setActiveTab(id as PersonnelTabId);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Verileriniz yükleniyor…</p>
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
                <PersonnelWorkLogItem
                  key={r.id}
                  log={r}
                  showActions
                  onUpdated={() => void reload()}
                />
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

    if (activeTab === 'finance' && stats) {
      return (
        <PersonnelFinancePanel
          stats={stats}
          employeeDailyWage={employee ? Number(employee.daily_wage) : undefined}
          advances={advances}
          otherDeductions={otherDeductions}
          minimumWages={minimumWages}
          onPrint={handlePrint}
        />
      );
    }

    if (activeTab === 'rights') {
      return <PersonnelRightsPanel workLogs={workLogs} />;
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-6">
          {employee && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Hesap Bilgileri
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">E-posta</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{employee.email}</dd>
                </div>
                {employee.phone && (
                  <div>
                    <dt className="text-gray-500">Telefon</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{employee.phone}</dd>
                  </div>
                )}
                {employee.iban_masked && (
                  <div>
                    <dt className="text-gray-500">IBAN</dt>
                    <dd className="font-medium text-gray-900 dark:text-white font-mono text-xs sm:text-sm">
                      {employee.iban_masked}
                    </dd>
                  </div>
                )}
                {employee.hire_date && (
                  <div>
                    <dt className="text-gray-500">İşe giriş</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {formatDate(employee.hire_date)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Günlük yevmiye</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatMoney(Number(employee.daily_wage))}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          <PersonnelDisplaySettings />
          <PersonnelContractsSection />
          <PersonnelPasswordForm />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-300 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-950/40 active:bg-red-200/80 transition-colors min-h-[48px] shadow-sm"
            >
              <FiLogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
              Oturumunuz güvenli şekilde sonlandırılır
            </p>
          </div>
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

    return (
      <div className="space-y-4 sm:space-y-6">
        <PersonnelPwaInstallBanner />

        <PersonnelAlertBar
          pendingApprovals={pendingEmployeeCount}
          pendingAdminDays={pendingAdminCount}
          onGoToWork={() => goTab('work')}
        />

        <PersonnelPendingApprovals workLogs={workLogs} onConfirmed={() => void reload()} />

        <PersonnelTodayAttendance />

        <PersonnelProjectCard project={employee?.project} />

        {employee && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Profil
            </p>
            <div className="flex items-center gap-4">
              <EmployeeAvatar
                name={employee.name}
                photoUrl={employee.photo_url}
                size="xl"
                className="!rounded-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {employee.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{employee.position}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  Günlük yevmiye: {formatMoney(Number(employee.daily_wage))}
                </p>
                {employee.hire_date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    İşe giriş: {formatDate(employee.hire_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {stats && <PersonnelStatGrid items={statItems} />}

        <PersonnelSection
          title="Son Yevmiyeler"
          icon={<FiBriefcase className="w-5 h-5 text-green-600" />}
          isEmpty={workLogs.length === 0}
        >
          <div>
            {workLogs.slice(0, 5).map((r) => (
              <PersonnelWorkLogItem key={r.id} log={r} onUpdated={() => void reload()} />
            ))}
          </div>
        </PersonnelSection>

        {loadFinance && advances.length > 0 && (
          <PersonnelSection
            title="Son Avanslar"
            icon={<FiCreditCard className="w-5 h-5 text-amber-600" />}
            isEmpty={advances.length === 0}
          >
            <div>
              {advances.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0 text-sm"
                >
                  <span>{formatDate(r.date)}</span>
                  <span className="font-medium">{formatMoney(Number(r.amount))}</span>
                </div>
              ))}
            </div>
          </PersonnelSection>
        )}
      </div>
    );
  };

  return (
    <PersonnelShell>
      <PersonnelPullToRefresh onRefresh={reload}>
        <div className="pb-20 sm:pb-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Hoş geldiniz{employee ? `, ${employee.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Puantaj onayları, proje bilgisi ve maaş özetiniz tek panelde.
            </p>
          </div>

          <div className="hidden sm:block">
            <PersonnelTabNav tabs={tabsWithBadges} active={activeTab} onChange={goTab} />
          </div>
          {renderContent()}
        </div>
      </PersonnelPullToRefresh>

      <PersonnelBottomNav tabs={mobileTabsWithBadges} active={activeTab} onChange={goTab} />
    </PersonnelShell>
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
