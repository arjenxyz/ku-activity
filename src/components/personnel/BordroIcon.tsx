import { PersonnelAssetIcon } from '@/components/personnel/PersonnelAssetIcon';

/** Bordro — `public/icons/bordro.png` */
export function BordroIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return <PersonnelAssetIcon name="finance" className={className} />;
}
