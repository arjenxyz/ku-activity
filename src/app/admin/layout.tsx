import { PanelChrome } from '@/components/dashboard/PanelChrome';
import { ADMIN_NAV } from '@/config/panel-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelChrome homeHref="/admin" title="Admin Panel" navItems={ADMIN_NAV}>
      {children}
    </PanelChrome>
  );
}
