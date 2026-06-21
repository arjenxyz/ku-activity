'use client';

import { useState } from 'react';
import {
  FiChevronRight,
  FiCreditCard,
  FiBriefcase,
  FiLock,
  FiLogOut,
  FiMail,
  FiPhone,
  FiUser,
} from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelDisplaySettings } from '@/components/personnel/PersonnelDisplaySettings';
import { PersonnelPasswordModal } from '@/components/personnel/PersonnelPasswordModal';
import { PersonnelProjectCard } from '@/components/personnel/PersonnelProjectCard';
import { formatDate, formatMoney } from '@/lib/format';
import { formatTurkishPhoneNational } from '@/lib/field-encryption';
import type { PersonnelEmployee } from '@/lib/personnel-api';

type Props = {
  employee: PersonnelEmployee;
  onLogout: () => void;
};

function formatIbanDisplay(iban: string | null | undefined) {
  if (!iban) return '—';
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

function formatPhoneDisplay(phone: string | null | undefined) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('90') ? digits.slice(2) : digits;
  if (national.length === 10) return formatTurkishPhoneNational(national);
  return phone;
}

export function PersonnelSettingsPage({ employee, onLogout }: Props) {
  const [passwordOpen, setPasswordOpen] = useState(false);

  const firstName = employee.first_name || employee.name.split(' ')[0] || '—';
  const lastName =
    employee.last_name || employee.name.split(' ').slice(1).join(' ') || '—';

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Profil hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)',
          }}
        />
        <div className="relative px-5 py-6 flex items-center gap-4">
          <EmployeeAvatar
            name={employee.name}
            photoUrl={employee.photo_url}
            size="xl"
            className="!rounded-2xl ring-2 ring-white/30 shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate">{employee.name}</h2>
            <p className="text-blue-100 text-sm mt-0.5 truncate">{employee.position}</p>
            {employee.project_name && (
              <span className="inline-block mt-2 text-[11px] font-medium bg-white/15 backdrop-blur px-2.5 py-1 rounded-full truncate max-w-full">
                {employee.project_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kişisel bilgiler — kayıt formundaki alanlar */}
      <SettingsGroup title="Kişisel bilgiler" icon={<FiUser className="w-4 h-4" />}>
        <InfoRow label="Ad" value={firstName} />
        <InfoRow label="Soyad" value={lastName} />
        <InfoRow label="T.C. kimlik no" value={employee.tc_kimlik || '—'} mono />
        <InfoRow
          label="Doğum tarihi"
          value={employee.birth_date ? formatDate(employee.birth_date) : '—'}
        />
      </SettingsGroup>

      <SettingsGroup title="İletişim" icon={<FiMail className="w-4 h-4" />}>
        <InfoRow label="E-posta" value={employee.email || '—'} />
        <InfoRow
          label="Telefon"
          value={formatPhoneDisplay(employee.phone)}
          icon={<FiPhone className="w-3.5 h-3.5 text-slate-400" />}
        />
      </SettingsGroup>

      <SettingsGroup title="Banka" icon={<FiCreditCard className="w-4 h-4" />}>
        <InfoRow label="IBAN" value={formatIbanDisplay(employee.iban)} mono />
      </SettingsGroup>

      <SettingsGroup title="İş bilgileri" icon={<FiBriefcase className="w-4 h-4" />}>
        <InfoRow label="Pozisyon" value={employee.position || '—'} />
        <InfoRow label="Günlük yevmiye" value={formatMoney(Number(employee.daily_wage))} />
        <InfoRow
          label="İşe giriş"
          value={employee.hire_date ? formatDate(employee.hire_date) : '—'}
        />
      </SettingsGroup>

      {employee.project && (
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Şantiye
          </p>
          <PersonnelProjectCard project={employee.project} />
        </div>
      )}

      {/* Güvenlik */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setPasswordOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <FiLock className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white">Giriş şifresi</p>
            <p className="text-xs text-slate-500 mt-0.5">PIN kodunuzu değiştirin</p>
          </div>
          <FiChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>
      </div>

      <PersonnelDisplaySettings />

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
      >
        <FiLogOut className="w-4 h-4" />
        Çıkış yap
      </button>

      <PersonnelPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </p>
      </div>
      <dl className="divide-y divide-slate-100 dark:divide-slate-700/80">{children}</dl>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd
        className={`text-sm font-medium text-slate-900 dark:text-white text-right break-all flex items-center gap-1.5 justify-end ${
          mono ? 'font-mono text-[13px]' : ''
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}
