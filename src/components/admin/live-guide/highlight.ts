import type { GuideHighlight } from '@/lib/admin/live-guide/types';

export function hlClass(
  id: GuideHighlight,
  active: GuideHighlight | undefined,
  pulse?: boolean
) {
  const on = active === id;
  return [
    'relative rounded-xl transition duration-300',
    on ? 'ring-2 ring-[#2D6AF6] ring-offset-2 bg-[#e8f0ff]/80' : '',
    on && pulse ? 'animate-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
