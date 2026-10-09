import { FiCheckSquare, FiClipboard, FiUsers } from 'react-icons/fi';
import type { GuideHighlight } from '@/lib/admin/live-guide/types';
import { hlClass } from '../highlight';

type Props = { highlight?: GuideHighlight; pulse?: boolean };

const TILES = [
  { label: 'Katılımcılar', icon: FiUsers },
  { label: 'Havale', icon: FiClipboard },
  { label: 'Check-in', icon: FiCheckSquare },
];

export function MockEventWorkspace({ highlight, pulse }: Props) {
  return (
    <div className="space-y-3" aria-hidden>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Etkinlik
        </p>
        <p className="text-sm font-semibold text-[#0E1548]">Abana 2027 · Çalışma alanı</p>
      </div>
      <div
        className={`grid grid-cols-3 gap-2 ${hlClass('workspace-hub', highlight, pulse)}`}
      >
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center"
            >
              <Icon className="mx-auto h-4 w-4 text-[#2D6AF6]" />
              <p className="mt-1 text-[10px] font-medium text-[#0E1548]">{tile.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
