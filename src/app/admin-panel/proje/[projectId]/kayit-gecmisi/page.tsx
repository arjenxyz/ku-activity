'use client';


import Link from 'next/link';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useParams } from 'next/navigation';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { cardClass } from '@/components/project/ui';
import { getRecordArchiveLinks } from '@/config/projectMenu';

export default function KayitGecmisiPage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/kayit-gecmisi/page');
  const { projectId } = useParams() as { projectId: string };
  const links = getRecordArchiveLinks(projectId);

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />

      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((item) => (
          <Link
            key={item.href(projectId)}
            href={item.href(projectId)}
            className={`${cardClass} p-4 hover:border-blue-200 hover:shadow-sm transition-all group`}
          >
            <p className="font-semibold text-slate-900 group-hover:text-blue-800">{item.label}</p>
            <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
