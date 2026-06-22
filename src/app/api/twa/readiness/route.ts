import { buildAssetLinksJson } from '@/lib/twa-asset-links';
import { buildAdminManifest, buildPersonnelManifest } from '@/lib/pwa-manifest';
import {
  TWA_ADMIN_PACKAGE_ID,
  TWA_ADMIN_SHA256,
  TWA_PERSONNEL_PACKAGE_ID,
  TWA_PERSONNEL_SHA256,
  getTwaOrigin,
} from '@/lib/twa-config';

/** TWA hazırlık kontrol listesi — deploy sonrası doğrulama */
export async function GET() {
  const origin = getTwaOrigin();
  const assetLinks = buildAssetLinksJson();

  const checklist = {
    origin,
    personnel: {
      packageId: TWA_PERSONNEL_PACKAGE_ID,
      manifestUrl: `${origin}/manifest-personnel.webmanifest`,
      iconUrl: `${origin}/icons/personnel/192`,
      startUrl: buildPersonnelManifest().start_url,
      sha256Configured: TWA_PERSONNEL_SHA256.length > 0,
    },
    admin: {
      packageId: TWA_ADMIN_PACKAGE_ID,
      manifestUrl: `${origin}/manifest-admin.webmanifest`,
      iconUrl: `${origin}/icons/admin/192`,
      startUrl: buildAdminManifest().start_url,
      sha256Configured: TWA_ADMIN_SHA256.length > 0,
    },
    assetLinksUrl: `${origin}/.well-known/assetlinks.json`,
    assetLinksEntryCount: assetLinks.length,
    privacyPolicyUrl: `${origin}/gizlilik`,
    serviceWorkerUrl: `${origin}/sw.js`,
    readyForBubblewrap: true,
    readyForPlayStore:
      TWA_PERSONNEL_SHA256.length > 0 && TWA_ADMIN_SHA256.length > 0,
    pending: [
      ...(TWA_PERSONNEL_SHA256.length === 0
        ? ['TWA_PERSONNEL_SHA256_FINGERPRINTS env değişkenini Vercel\'e ekleyin']
        : []),
      ...(TWA_ADMIN_SHA256.length === 0
        ? ['TWA_ADMIN_SHA256_FINGERPRINTS env değişkenini Vercel\'e ekleyin']
        : []),
      'Bubblewrap ile iki AAB oluşturun (twa/README.md)',
      'Play Console\'da iki listing + gizlilik URL\'si',
    ],
  };

  return Response.json(checklist, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
