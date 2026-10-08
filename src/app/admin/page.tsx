import { DemoPanel } from '@/components/demo/DemoPanel';
import { SignupApproval } from '@/components/admin/SignupApproval';
import { TeamOpeningPanel } from '@/components/admin/TeamOpeningPanel';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <DemoPanel view="admin-home" />
      <SignupApproval />
      <TeamOpeningPanel />
    </div>
  );
}
