import { cardClass } from '@/components/ui/styles';

export function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={`${cardClass} p-6`}>
      <h1 className="text-lg font-bold text-[#0E1548]">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Phase 1 foundation — içerik sonraki sürümlerde eklenecek.
      </p>
    </div>
  );
}
