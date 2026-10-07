import { PlaceholderCard } from '@/components/dashboard/PlaceholderCard';
import { StatCard } from '@/components/ui/StatCard';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <PlaceholderCard
        title="Dashboard"
        description="Etkinlik özeti ve yönetim kısayolları burada yer alacak."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Events" value="—" />
        <StatCard title="Participants" value="—" />
        <StatCard title="Check-ins" value="—" />
      </div>
    </div>
  );
}
