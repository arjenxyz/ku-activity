import {
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';
import type { GuideHighlight, GuideNavMode } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

const ROOT = [
  { id: 'nav-home' as const, label: 'Admin ana sayfası', icon: FiHome },
  { id: 'nav-events' as const, label: 'Etkinlikler', icon: FiCalendar },
  { id: 'nav-team' as const, label: 'Ekip ilanı', icon: FiUsers },
  { id: 'nav-audit' as const, label: 'Denetim kayıtları', icon: FiFileText },
  { id: 'nav-settings' as const, label: 'Ayarlar', icon: FiSettings },
];

const EVENT = [
  { id: 'nav-workspace' as const, label: 'Çalışma alanı', icon: FiHome },
  { id: 'nav-participants' as const, label: 'Katılımcılar', icon: FiUsers },
  { id: 'nav-reviews' as const, label: 'Havale incelemeleri', icon: FiClipboard },
  { id: 'nav-cash' as const, label: 'Elden teslim al', icon: FiCheckSquare },
  { id: 'nav-custody' as const, label: 'Kasa / yetkili devir', icon: FiUsers },
  { id: 'nav-checkin' as const, label: 'Check-in', icon: FiCheckSquare },
  { id: 'nav-reports' as const, label: 'Raporlar', icon: FiFileText },
  { id: 'nav-edit' as const, label: 'Düzenle', icon: FiSettings },
];

type Props = {
  mode: GuideNavMode;
  highlight?: GuideHighlight;
  pulse?: boolean;
  compact?: boolean;
};

export function MockSideNav({ mode, highlight, pulse, compact }: Props) {
  const items = mode === 'event' ? EVENT : ROOT;
  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white ${
        compact ? 'w-full p-1.5' : 'w-full p-2 lg:w-52'
      }`}
      aria-hidden
    >
      {mode === 'event' ? (
        <p className="mb-1 truncate px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Abana 2027
        </p>
      ) : (
        <p className="mb-1 truncate px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Ana menü
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id} className={hlClass(item.id, highlight, pulse)}>
              <span className="flex items-center gap-2 px-2 py-1.5 text-[#0E1548]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate text-xs font-medium">{item.label}</span>
              </span>
            </li>
          );
        })}
        {mode === 'root' ? (
          <li className={hlClass('settings-logout', highlight, pulse)}>
            <span className="flex items-center gap-2 px-2 py-1.5 text-red-600">
              <FiLogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-xs font-medium">Çıkış yap</span>
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
