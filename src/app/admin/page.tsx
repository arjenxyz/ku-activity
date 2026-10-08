import { DemoPanel } from '@/components/demo/DemoPanel';
import { SignupApproval } from '@/components/admin/SignupApproval';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <DemoPanel view="admin-home" />
      <SignupApproval />
    </div>
  );
}
