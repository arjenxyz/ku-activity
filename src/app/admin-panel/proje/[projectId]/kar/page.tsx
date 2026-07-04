'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/kar/page.json';
import { formatString } from '@/lib/strings/format';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { BlockProfitCard } from '@/components/project/profit/BlockProfitCard';
import { AddJobModal } from '@/components/project/profit/AddJobModal';
import { JobProfitCard } from '@/components/project/profit/JobProfitCard';
import { PartnerSettings } from '@/components/project/profit/PartnerSettings';
import { ProfitFormulaHelp } from '@/components/project/profit/ProfitFormulaHelp';
import { ProfitQuickActions } from '@/components/project/profit/ProfitQuickActions';
import { ProfitTotalsStrip } from '@/components/project/profit/ProfitTotalsStrip';
import { cardClass } from '@/components/project/ui';
import {
  addProjectPartner,
  createProjectJob,
  deleteProjectJob,
  deleteProjectPartner,
  fetchProjectProfit,
  updateProfitShareCount,
  updateProjectJob,
} from '@/lib/project-api';
import type { ExtendedProfitOverview } from '@/types/project-job';

type JobFilter = 'all' | 'active' | 'completed';
type ViewMode = 'jobs' | 'blocks';

export default function KarPage() {
  const { projectId } = useParams() as { projectId: string };
  const [overview, setOverview] = useState<ExtendedProfitOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState('1');
  const [partnerName, setPartnerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<JobFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await fetchProjectProfit(projectId);
      setOverview(data);
      setShareCount(String(data.settings.share_count));
      setExpandedId((prev) => {
        if (prev && data.jobs.some((j) => j.job.id === prev)) return prev;
        const firstActive = data.jobs.find((j) => j.job.status === 'active');
        return firstActive?.job.id ?? data.jobs[0]?.job.id ?? null;
      });
      setExpandedBlockId((prev) => {
        if (prev && data.blockSummaries?.some((b) => b.block.id === prev)) return prev;
        const firstActive = data.blockSummaries?.find((b) => b.block.status === 'active');
        return firstActive?.block.id ?? data.blockSummaries?.[0]?.block.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const filteredJobs = useMemo(() => {
    if (!overview) return [];
    if (jobFilter === 'all') return overview.jobs;
    return overview.jobs.filter((j) => j.job.status === jobFilter);
  }, [overview, jobFilter]);

  const counts = useMemo(() => {
    if (!overview) return { all: 0, active: 0, completed: 0 };
    return {
      all: overview.jobs.length,
      active: overview.jobs.filter((j) => j.job.status === 'active').length,
      completed: overview.jobs.filter((j) => j.job.status === 'completed').length,
    };
  }, [overview]);

  const notify = (msg: string) => {
    setSuccess(msg);
    setError(null);
  };

  const handleShareSave = async () => {
    setSaving(true);
    try {
      const { overview: next } = await updateProfitShareCount(projectId, Number(shareCount));
      setOverview(next);
      notify(strings.successShareUpdated);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    setSaving(true);
    try {
      await addProjectPartner(projectId, partnerName.trim());
      setPartnerName('');
      await load(true);
      notify(strings.successPartnerAdded);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.addPartnerFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleAddJob = async (data: {
    name: string;
    unitLabel: string;
    unitPrice: number;
    quantity: number;
    notes?: string;
    blockId?: string | null;
  }) => {
    setSaving(true);
    try {
      const { overview: next } = await createProjectJob(projectId, data);
      setOverview(next);
      setExpandedId(next.jobs[next.jobs.length - 1]?.job.id ?? null);
      notify(formatString(strings.successJobAdded, { name: data.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.addJobFailed);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const filterTabs: { id: JobFilter; label: string; count: number }[] = [
    { id: 'all', label: strings.filterAll, count: counts.all },
    { id: 'active', label: strings.filterActive, count: counts.active },
    { id: 'completed', label: strings.filterCompleted, count: counts.completed },
  ];

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />

      <ProfitQuickActions
        projectId={projectId}
        onAddJob={() => setAddJobOpen(true)}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}
      {overview && overview.teamsWithoutBlock?.length > 0 && (
        <AlertBanner
          type="error"
          message={formatString(strings.teamsWithoutBlockAlert, {
            count: overview.teamsWithoutBlock.length,
            teamNames: overview.teamsWithoutBlock.map((t) => t.name).join(', '),
          })}
        />
      )}

      {loading ? (
        <div className={`${cardClass} p-12 text-center text-sm text-slate-500`}>{strings.loading}</div>
      ) : overview ? (
        <>
          <ProfitTotalsStrip overview={overview} />
          <ProfitFormulaHelp />

          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('blocks')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'blocks'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {strings.viewBlocks}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('jobs')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'jobs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {strings.viewJobs}
            </button>
          </div>

          {viewMode === 'blocks' ? (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">{strings.blockSummaryTitle}</h2>
              {overview.blockSummaries.length === 0 ? (
                <div className={`${cardClass} p-10 text-center`}>
                  <p className="text-slate-600 font-medium">{strings.noBlocksTitle}</p>
                  <p className="text-sm text-slate-500 mt-2">{strings.noBlocksHint}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overview.blockSummaries.map((summary) => (
                    <BlockProfitCard
                      key={summary.block.id}
                      summary={summary}
                      expanded={expandedBlockId === summary.block.id}
                      onToggle={() =>
                        setExpandedBlockId((id) =>
                          id === summary.block.id ? null : summary.block.id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">{strings.jobsTitle}</h2>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setJobFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                      jobFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1 text-slate-400">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className={`${cardClass} p-10 text-center`}>
                <p className="text-slate-600 font-medium">
                  {overview.jobs.length === 0
                    ? strings.noJobsTitle
                    : strings.noJobsFilteredTitle}
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{strings.noJobsHint}</p>
                <button
                  type="button"
                  onClick={() => setAddJobOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
                >
                  {strings.addFirstJobButton}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((item) => (
                  <JobProfitCard
                    key={item.job.id}
                    projectId={projectId}
                    item={item}
                    expanded={expandedId === item.job.id}
                    onToggle={() =>
                      setExpandedId((id) => (id === item.job.id ? null : item.job.id))
                    }
                    disabled={saving}
                    onOverview={setOverview}
                    onToggleStatus={async () => {
                      setSaving(true);
                      try {
                        const nextStatus =
                          item.job.status === 'active' ? 'completed' : 'active';
                        const { overview: next } = await updateProjectJob(
                          projectId,
                          item.job.id,
                          { status: nextStatus }
                        );
                        setOverview(next);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : strings.updateFailed);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    onDelete={async () => {
                      if (!confirm(formatString(strings.deleteJobConfirm, { name: item.job.name }))) {
                        return;
                      }
                      setSaving(true);
                      try {
                        const { overview: next } = await deleteProjectJob(
                          projectId,
                          item.job.id
                        );
                        setOverview(next);
                        if (expandedId === item.job.id) setExpandedId(null);
                        notify(strings.successJobDeleted);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : strings.deleteFailed);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>
          )}

          <PartnerSettings
            shareCount={shareCount}
            onShareCountChange={setShareCount}
            onShareSave={handleShareSave}
            saving={saving}
            partnerName={partnerName}
            onPartnerNameChange={setPartnerName}
            onAddPartner={handleAddPartner}
            partners={overview.partners}
            onRemovePartner={async (id) => {
              setSaving(true);
              try {
                await deleteProjectPartner(projectId, id);
                await load(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : strings.deleteFailed);
              } finally {
                setSaving(false);
              }
            }}
          />
        </>
      ) : null}

      <AddJobModal
        open={addJobOpen}
        onClose={() => setAddJobOpen(false)}
        onSubmit={handleAddJob}
        saving={saving}
        blocks={overview?.blocks}
      />
    </div>
  );
}
