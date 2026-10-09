import { PanelChrome } from '@/components/dashboard/PanelChrome';
import { STUDENT_NAV } from '@/config/panel-nav';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelChrome homeHref="/student" navItems={STUDENT_NAV}>
      {children}
    </PanelChrome>
  );
}
