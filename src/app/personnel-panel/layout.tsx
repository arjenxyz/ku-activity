import { PersonnelDisplayProvider } from '@/lib/personnel-display-preferences';

export default function PersonnelPanelLayout({ children }: { children: React.ReactNode }) {
  return <PersonnelDisplayProvider>{children}</PersonnelDisplayProvider>;
}
