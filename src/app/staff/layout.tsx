import { PanelChrome } from '@/components/dashboard/PanelChrome';
import { STAFF_NAV } from '@/config/panel-nav';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelChrome homeHref="/staff" navItems={STAFF_NAV}>
      {children}
    </PanelChrome>
  );
}
