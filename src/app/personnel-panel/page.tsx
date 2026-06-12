'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiList,
  FiPrinter,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiXCircle,
} from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelCalendar } from '@/components/personnel/PersonnelCalendar';
import { PersonnelAlertBar } from '@/components/personnel/PersonnelAlertBar';
import { PersonnelMesaiSummary } from '@/components/personnel/PersonnelMesaiSummary';
import { PersonnelPendingApprovals } from '@/components/personnel/PersonnelPendingApprovals';
import { PersonnelProjectCard } from '@/components/personnel/PersonnelProjectCard';
import { PersonnelTodayAttendance } from '@/components/personnel/PersonnelTodayAttendance';
import { PersonnelMonthFilter } from '@/components/personnel/PersonnelMonthFilter';
import { PersonnelContractsSection } from '@/components/personnel/PersonnelContractsSection';
import { PersonnelPasswordForm } from '@/components/personnel/PersonnelPasswordForm';
import { PersonnelRightsPanel } from '@/components/personnel/PersonnelRightsPanel';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PersonnelStatGrid } from '@/components/personnel/PersonnelStatGrid';
import { PersonnelTabNav } from '@/components/personnel/PersonnelTabNav';
import {
  PersonnelBadge,
  PersonnelRecordRow,
  PersonnelSection,
} from '@/components/personnel/PersonnelRecordCard';
import { usePersonnelDashboard } from '@/hooks/usePersonnelDashboard';
import { formatDate, formatMoney } from '@/lib/format';
import {
  formatWorkLogSummary,
  getWorkLogApprovalStatus,
  approvalStatusLabel,
} from '@/lib/work-log';
import {
  buildMonthCalendar,
  currentMonth,
  deductionTypeLabel,
  workDayLabel,
  type WorkLog,
} from '@/lib/personnel-stats';

const TABS = [
  { id: 'overview', label: 'Özet', icon: <FiList className="w-4 h-4" /> },
  { id: 'work', label: 'Yevmiye', icon: <FiBriefcase className="w-4 h-4" /> },
  { id: 'advance', label: 'Avans', icon: <FiCreditCard className="w-4 h-4" /> },
  { id: 'deduction', label: 'Kesinti', icon: <FiXCircle className="w-4 h-4" /> },
  { id: 'minimum', label: 'Asgari', icon: <FiShield className="w-4 h-4" /> },
  { id: 'calendar', label: 'Takvim', icon: <FiCalendar className="w-4 h-4" /> },
  { id: 'salary', label: 'Maaş', icon: <FiDollarSign className="w-4 h-4" /> },
  { id: 'rights', label: 'Haklarım', icon: <FiBookOpen className="w-4 h-4" /> },
  { id: 'settings', label: 'Ayarlar', icon: <FiSettings className="w-4 h-4" /> },
];

function approvalBadge(log: Pick<WorkLog, 'approved' | 'admin_confirmed_at' | 'employee_confirmed_at'>) {
  const status = getWorkLogApprovalStatus(log);
  if (status === 'confirmed') {
    return <PersonnelBadge variant="success">Onaylı</PersonnelBadge>;
  }
  if (status === 'pending_employee') {
    return <PersonnelBadge variant="warning">Sizin onayınız</PersonnelBadge>;
  }
  if (status === 'pending_admin') {
    return <PersonnelBadge variant="warning">Yönetici bekliyor</PersonnelBadge>;
  }
  return <PersonnelBadge variant="warning">{approvalStatusLabel(status)}</PersonnelBadge>;
}

export default function PersonelPanel() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth);
  const [activeTab, setActiveTab] = useState('overview');
  const { employee, workLogs, deductions, minimumWages, stats, loading, error, reload } =
    usePersonnelDashboard(month);

  const pendingEmployeeCount = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_employee'
  ).length;
  const pendingAdminCount = workLogs.filter(
    (log) => getWorkLogApprovalStatus(log) === 'pending_admin'
  ).length;
  const alertCount = pendingEmployeeCount + (pendingAdminCount > 0 ? 1 : 0);

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
          label: 'Onaylı Gün',
          value: stats.approvedDays.toString(),
          icon: <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          accent: 'bg-emerald-50 dark:bg-emerald-900/30',
        },
        {
          label: 'Bekleyen Gün',
          value: stats.pendingDays.toString(),
          icon: <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          accent: 'bg-amber-50 dark:bg-amber-900/30',
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

  const handlePrint = () => {
    window.print();
  };

  const tabsWithBadges = TABS.map((tab) => ({
    ...tab,
    badge:
      tab.id === 'work' && pendingEmployeeCount > 0 ? pendingEmployeeCount : undefined,
  }));

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
        <PersonnelSection
          title="Yevmiye Kayıtları"
          icon={<FiBriefcase className="w-5 h-5 text-green-600" />}
          isEmpty={workLogs.length === 0}
        >
          <div>
            {workLogs.map((r) => (
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={
                  <div className="flex flex-col items-end gap-1">
                    <PersonnelBadge variant={r.amount === 1 ? 'success' : 'warning'}>
                      {workDayLabel(Number(r.amount), r.mesai_type)}
                    </PersonnelBadge>
                    {approvalBadge(r)}
                  </div>
                }
                sub={
                  r.description ||
                  formatWorkLogSummary(Number(r.amount), r.mesai_type ?? null)
                }
              />
            ))}
          </div>
        </PersonnelSection>
      );
    }

    if (activeTab === 'advance') {
      return (
        <PersonnelSection
          title="Avans Kayıtları"
          icon={<FiCreditCard className="w-5 h-5 text-amber-600" />}
          isEmpty={advances.length === 0}
        >
          <div>
            {advances.map((r) => (
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={formatMoney(Number(r.amount))}
                sub={r.description || undefined}
              />
            ))}
          </div>
        </PersonnelSection>
      );
    }

    if (activeTab === 'deduction') {
      return (
        <PersonnelSection
          title="Kesinti Kayıtları"
          icon={<FiXCircle className="w-5 h-5 text-red-500" />}
          isEmpty={otherDeductions.length === 0}
        >
          <div>
            {otherDeductions.map((r) => (
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={formatMoney(Number(r.amount))}
                sub={r.description || deductionTypeLabel(r.type)}
              />
            ))}
          </div>
        </PersonnelSection>
      );
    }

    if (activeTab === 'minimum') {
      return (
        <PersonnelSection
          title="Asgari Ücret Kayıtları"
          icon={<FiShield className="w-5 h-5 text-indigo-600" />}
          isEmpty={minimumWages.length === 0}
          emptyMessage="Bu dönem için asgari ücret kaydı yok"
        >
          <div>
            {minimumWages.map((r) => (
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={formatMoney(Number(r.amount))}
                sub={r.description || undefined}
              />
            ))}
          </div>
          {stats && stats.totalMinimum > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dönem toplamı: {formatMoney(stats.totalMinimum)}
              </p>
            </div>
          )}
        </PersonnelSection>
      );
    }

    if (activeTab === 'calendar') {
      return <PersonnelCalendar days={calendarDays} />;
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
          <PersonnelContractsSection />
          <PersonnelPasswordForm />
        </div>
      );
    }

    if (activeTab === 'salary' && stats) {
      return (
        <div className="space-y-4 print-area">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Tahmini Net Maaş</p>
                <p className="text-3xl sm:text-4xl font-bold mt-2">{formatMoney(stats.net)}</p>
                <p className="text-xs text-blue-100/80 mt-3">
                  Brüt {formatMoney(stats.gross)} − Avans {formatMoney(stats.totalAdvance)} − Kesinti{' '}
                  {formatMoney(stats.totalDeduct)}
                  {stats.totalMinimum > 0 && ` · Asgari ${formatMoney(stats.totalMinimum)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="print:hidden shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm"
              >
                <FiPrinter className="w-4 h-4" />
                Yazdır
              </button>
            </div>
          </div>
          <PersonnelStatGrid
            items={[
              {
                label: 'Günlük Yevmiye',
                value: employee ? formatMoney(Number(employee.daily_wage)) : '—',
                icon: <FiBriefcase className="w-5 h-5 text-blue-600" />,
                accent: 'bg-blue-50 dark:bg-blue-900/30',
              },
              {
                label: 'Onaylı / Bekleyen',
                value: `${stats.approvedDays} / ${stats.pendingDays}`,
                icon: <FiCheckCircle className="w-5 h-5 text-emerald-600" />,
                accent: 'bg-emerald-50 dark:bg-emerald-900/30',
              },
              {
                label: 'Brüt',
                value: formatMoney(stats.gross),
                icon: <FiTrendingUp className="w-5 h-5 text-emerald-600" />,
                accent: 'bg-emerald-50 dark:bg-emerald-900/30',
              },
              {
                label: 'Kesintiler',
                value: formatMoney(stats.totalDeduct),
                icon: <FiXCircle className="w-5 h-5 text-red-500" />,
                accent: 'bg-red-50 dark:bg-red-900/30',
              },
            ]}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        <PersonnelAlertBar
          pendingApprovals={pendingEmployeeCount}
          pendingAdminDays={pendingAdminCount}
          onGoToWork={() => setActiveTab('work')}
        />

        <PersonnelPendingApprovals workLogs={workLogs} onConfirmed={() => void reload()} />

        <PersonnelTodayAttendance />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PersonnelProjectCard project={employee?.project} />
          <PersonnelMesaiSummary workLogs={workLogs} />
        </div>

        {employee && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 sm:p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Profil
            </p>
            <div className="flex items-center gap-4">
              <EmployeeAvatar name={employee.name} photoUrl={employee.photo_url} size="lg" className="!rounded-2xl" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{employee.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{employee.position}</p>
                {employee.project_name && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {employee.project_name}
                  </p>
                )}
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  Günlük yevmiye: {formatMoney(Number(employee.daily_wage))}
                </p>
                {employee.hire_date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    İşe giriş: {formatDate(employee.hire_date)}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {employee.email}
                </p>
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
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={
                  <div className="flex items-center gap-2">
                    <span>{workDayLabel(Number(r.amount), r.mesai_type)}</span>
                    {approvalBadge(r)}
                  </div>
                }
              />
            ))}
          </div>
        </PersonnelSection>

        <PersonnelSection
          title="Son Avanslar"
          icon={<FiCreditCard className="w-5 h-5 text-amber-600" />}
          isEmpty={advances.length === 0}
        >
          <div>
            {advances.slice(0, 5).map((r) => (
              <PersonnelRecordRow
                key={r.id}
                left={formatDate(r.date)}
                right={formatMoney(Number(r.amount))}
              />
            ))}
          </div>
        </PersonnelSection>
      </div>
    );
  };

  return (
    <PersonnelShell
      employeeName={employee?.name}
      position={employee?.position}
      alertCount={alertCount}
      onLogout={handleLogout}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Hoş geldiniz{employee ? `, ${employee.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Puantaj onayları, proje bilgisi ve maaş özetiniz tek panelde.
        </p>
      </div>

      <PersonnelMonthFilter month={month} onChange={setMonth} />
      <PersonnelTabNav tabs={tabsWithBadges} active={activeTab} onChange={setActiveTab} />
      {renderContent()}
    </PersonnelShell>
  );
}
