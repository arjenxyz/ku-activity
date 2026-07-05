import { PersonnelClosureDossierPanel } from './PersonnelClosureDossierPanel';

/** Proje kapanış modunda gösterilecek veri indirme ekranı */
export function PersonnelClosureScreen() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-1">
      <PersonnelClosureDossierPanel variant="closure" />
    </div>
  );
}
