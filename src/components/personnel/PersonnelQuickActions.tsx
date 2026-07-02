'use client';

import {
  FiBookOpen,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiSettings,
  FiShield,
} from 'react-icons/fi';

type Action = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  onClick: () => void;
};

export function PersonnelQuickActions({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const actions: Action[] = [
    {
      id: 'work',
      label: 'Yevmiye',
      description: 'Çalışma günleri',
      icon: <FiBriefcase className="w-5 h-5" />,
      tone: 'bg-emerald-500 text-white',
      onClick: () => onNavigate('work'),
    },
    {
      id: 'mesai',
      label: 'Mesai',
      description: 'Fazla çalışma',
      icon: <FiClock className="w-5 h-5" />,
      tone: 'bg-violet-500 text-white',
      onClick: () => onNavigate('mesai'),
    },
    {
      id: 'finance',
      label: 'Finans',
      description: 'Bordro özeti',
      icon: <FiDollarSign className="w-5 h-5" />,
      tone: 'bg-blue-600 text-white',
      onClick: () => onNavigate('finance'),
    },
    {
      id: 'asgari',
      label: 'Asgari',
      description: 'Ödeme durumu',
      icon: <FiShield className="w-5 h-5" />,
      tone: 'bg-indigo-500 text-white',
      onClick: () => onNavigate('asgari'),
    },
    {
      id: 'rights',
      label: 'Haklarım',
      description: 'Sözleşmeler',
      icon: <FiBookOpen className="w-5 h-5" />,
      tone: 'bg-sky-500 text-white',
      onClick: () => onNavigate('rights'),
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      description: 'Profil ve PIN',
      icon: <FiSettings className="w-5 h-5" />,
      tone: 'bg-slate-600 text-white',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Hızlı erişim
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 sm:p-4 text-center shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 active:scale-[0.98] transition-all"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-md ${action.tone} group-hover:scale-105 transition-transform`}
            >
              {action.icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                {action.label}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {action.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
