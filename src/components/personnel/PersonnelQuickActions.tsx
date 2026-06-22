'use client';

import {
  FiBookOpen,
  FiClock,
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
      id: 'mesai',
      label: 'Mesai',
      description: 'Fazla çalışma',
      icon: <FiClock className="w-5 h-5" />,
      tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
      onClick: () => onNavigate('mesai'),
    },
    {
      id: 'asgari',
      label: 'Asgari',
      description: 'Ödeme durumu',
      icon: <FiShield className="w-5 h-5" />,
      tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      onClick: () => onNavigate('asgari'),
    },
    {
      id: 'rights',
      label: 'Haklarım',
      description: 'Sözleşmeler',
      icon: <FiBookOpen className="w-5 h-5" />,
      tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
      onClick: () => onNavigate('rights'),
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      description: 'Profil ve PIN',
      icon: <FiSettings className="w-5 h-5" />,
      tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:hidden">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-3 text-left shadow-sm active:scale-[0.98] transition-transform"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.tone}`}
          >
            {action.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
              {action.label}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {action.description}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
