'use client';

import { AdminAppSettings } from '@/components/admin/AdminAppSettings';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

export default function AdminSettingsPage() {
  const strings = useRegistryStrings('app/admin-panel/ayarlar/page');

  return (
    <div>
      <ProjectPageHeader title={strings.title} description={strings.subtitle} />
      <AdminAppSettings />
    </div>
  );
}
