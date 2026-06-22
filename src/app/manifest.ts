import { buildPersonnelManifest } from '@/lib/pwa-manifest';

/** Varsayılan manifest — personel uygulaması (tarayıcı PWA kurulumu) */
export default function manifest() {
  return buildPersonnelManifest();
}
