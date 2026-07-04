'use client';

import strings from '@json/src/app/admin-panel/proje/[projectId]/bloklar/page.json';
import { formatString } from '@/lib/strings/format';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/project/ui';
import {
  completeProjectBlock,
  createProjectBlock,
  fetchProjectBlocks,
} from '@/lib/project-api';
import type { ProjectBlock } from '@/types/project-block';
import { PROJECT_BLOCK_STATUS_LABELS } from '@/types/project-block';

export default function BloklarPage() {
  const { projectId } = useParams() as { projectId: string };
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectBlocks(projectId);
      setBlocks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createProjectBlock(projectId, { name: name.trim() });
      setName('');
      await load();
      setSuccess(strings.successCreated);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (block: ProjectBlock) => {
    if (!confirm(formatString(strings.completeConfirm, { name: block.name }))) {
      return;
    }
    setSaving(true);
    try {
      await completeProjectBlock(projectId, block.id);
      await load();
      setSuccess(formatString(strings.successCompleted, { name: block.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.actionFailed);
    } finally {
      setSaving(false);
    }
  };

  const active = blocks.filter((b) => b.status === 'active');
  const completed = blocks.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">{strings.sectionNewBlock}</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}>{strings.labelBlockName}</label>
            <input
              className={inputClass}
              placeholder={strings.placeholderBlockName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={saving}>
            {strings.addButton}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          {strings.hintAfterCompletePrefix}{' '}
          <Link href={`/admin-panel/proje/${projectId}/ekiplar`} className="text-emerald-700 hover:underline">
            {strings.hintTeamsLink}
          </Link>{' '}
          {strings.hintAfterCompleteSuffix}
        </p>
      </div>

      {loading ? (
        <div className={`${cardClass} p-10 text-center text-sm text-slate-500`}>{strings.loading}</div>
      ) : (
        <>
          <BlockList
            title={strings.activeBlocksTitle}
            blocks={active}
            empty={strings.activeBlocksEmpty}
            onComplete={handleComplete}
            saving={saving}
          />
          {completed.length > 0 && (
            <BlockList title={strings.completedBlocksTitle} blocks={completed} readOnly />
          )}
        </>
      )}
    </div>
  );
}

function BlockList({
  title,
  blocks,
  empty,
  onComplete,
  saving,
  readOnly,
}: {
  title: string;
  blocks: ProjectBlock[];
  empty?: string;
  onComplete?: (b: ProjectBlock) => void;
  saving?: boolean;
  readOnly?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {blocks.length === 0 ? (
        <div className={`${cardClass} p-6 text-sm text-slate-500`}>{empty ?? strings.defaultEmpty}</div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`${cardClass} px-4 py-3 flex flex-wrap items-center justify-between gap-3`}
            >
              <div>
                <p className="font-medium text-slate-900">{block.name}</p>
                <p className="text-xs text-slate-500">
                  {PROJECT_BLOCK_STATUS_LABELS[block.status]}
                  {block.completed_at &&
                    ` · ${new Date(block.completed_at).toLocaleDateString('tr-TR')}`}
                </p>
              </div>
              {!readOnly && onComplete && block.status === 'active' && (
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={saving}
                  onClick={() => onComplete(block)}
                >
                  {strings.completeButton}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
