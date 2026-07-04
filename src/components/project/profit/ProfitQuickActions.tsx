'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';

type Props = {
  projectId: string;
  onAddJob: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
};

function useProfitQuickLinks(projectId: string, jobId?: string) {
  const strings = useRegistryStrings('components/project/profit/ProfitQuickActions');
  return useMemo(() => {
    const q = jobId ? `?job=${jobId}` : '';
    return [
      { label: strings.links.blocks, href: `/admin-panel/proje/${projectId}/bloklar` },
      { label: strings.links.teams, href: `/admin-panel/proje/${projectId}/ekiplar` },
      { label: strings.links.workLogs, href: `/admin-panel/proje/${projectId}/yevmiye${q}` },
      { label: strings.links.advance, href: `/admin-panel/proje/${projectId}/avans${q}` },
      { label: strings.links.deduction, href: `/admin-panel/proje/${projectId}/kesinti${q}` },
    ];
  }, [jobId, projectId, strings.links]);
}

export function ProfitQuickActions({ projectId, onAddJob, onRefresh, refreshing }: Props) {
  const strings = useRegistryStrings('components/project/profit/ProfitQuickActions');
  const quickLinks = useProfitQuickLinks(projectId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onAddJob}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors"
      >
        <FiPlus className="w-4 h-4" />
        {strings.addJob}
      </button>
      {quickLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {l.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 ml-auto"
        title={strings.refreshTitle}
      >
        <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {strings.refresh}
      </button>
    </div>
  );
}

export function JobQuickLinks({ projectId, jobId }: { projectId: string; jobId: string }) {
  const quickLinks = useProfitQuickLinks(projectId, jobId);
  return (
    <div className="flex flex-wrap gap-2">
      {quickLinks.slice(2).map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          + {l.label}
        </Link>
      ))}
    </div>
  );
}
