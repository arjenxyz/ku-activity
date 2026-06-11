import { AdminPanelLayout } from '@/components/dashboard/AdminPanelLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
