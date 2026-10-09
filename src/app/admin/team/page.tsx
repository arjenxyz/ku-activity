import { TeamOpeningPanel } from '@/components/admin/TeamOpeningPanel';

export default function AdminTeamPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#0E1548]">Ekip ilanı</h1>
        <p className="mt-1 text-sm text-slate-500">
          İlanı aç; giriş yapmış kullanıcılar ekip sayfasından başvurur.
        </p>
      </div>
      <TeamOpeningPanel />
    </div>
  );
}
