import {
  TWA_ADMIN_PACKAGE_ID,
  TWA_ADMIN_SHA256,
  TWA_PERSONNEL_PACKAGE_ID,
  TWA_PERSONNEL_SHA256,
} from '@/lib/twa-config';

type AssetLinkTarget = {
  namespace: 'android_app';
  package_name: string;
  sha256_cert_fingerprints: string[];
};

export type AssetLinkEntry = {
  relation: ['delegate_permission/common.handle_all_urls'];
  target: AssetLinkTarget;
};

/** Digital Asset Links — Google Play TWA doğrulaması */
export function buildAssetLinksJson(): AssetLinkEntry[] {
  const entries: AssetLinkEntry[] = [];

  if (TWA_PERSONNEL_SHA256.length > 0) {
    entries.push({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: TWA_PERSONNEL_PACKAGE_ID,
        sha256_cert_fingerprints: TWA_PERSONNEL_SHA256,
      },
    });
  }

  if (TWA_ADMIN_SHA256.length > 0) {
    entries.push({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: TWA_ADMIN_PACKAGE_ID,
        sha256_cert_fingerprints: TWA_ADMIN_SHA256,
      },
    });
  }

  return entries;
}
