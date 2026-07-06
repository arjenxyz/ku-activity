'use client';

import { HonorIconGlyph, type HonorIconName } from '@/components/icons/HonorIcons';

type IconProps = { className?: string; filled?: boolean };

function NavIcon({
  name,
  className = 'w-5 h-5',
  filled = false,
}: IconProps & { name: HonorIconName }) {
  return (
    <HonorIconGlyph
      name={name}
      className={className}
      style={filled ? undefined : { opacity: 0.92 }}
    />
  );
}

export function NavIconHome(props: IconProps) {
  return <NavIcon name="home" {...props} />;
}

export function NavIconWork(props: IconProps) {
  return <NavIcon name="work" {...props} />;
}

export function NavIconFinance(props: IconProps) {
  return <NavIcon name="finance" {...props} />;
}

export function NavIconMenu(props: IconProps) {
  return <NavIcon name="menu" {...props} />;
}

export function NavIconQr({ className = 'w-6 h-6', filled = false }: IconProps) {
  return <NavIcon name="qr" className={className} filled={filled} />;
}

export function NavIconMesai(props: IconProps) {
  return <NavIcon name="mesai" {...props} />;
}

export function NavIconAsgari(props: IconProps) {
  return <NavIcon name="shield" {...props} />;
}

export function NavIconRights(props: IconProps) {
  return <NavIcon name="rights" {...props} />;
}

export function NavIconSettings(props: IconProps) {
  return <NavIcon name="settings" {...props} />;
}
