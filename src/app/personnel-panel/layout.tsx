import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';
import { PersonnelPanelChrome } from '@/components/personnel/PersonnelPanelChrome';

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonnelDisplayProvider>
      <PersonnelPanelChrome>{children}</PersonnelPanelChrome>
    </PersonnelDisplayProvider>
  );
}
