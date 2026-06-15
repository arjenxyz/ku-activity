'use client';

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
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
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
      setSuccess('Blok oluşturuldu. Ekiplere atayın.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (block: ProjectBlock) => {
    if (
      !confirm(
        `"${block.name}" tamamlandı olarak işaretlensin mi?\n\nBu bloktaki ekiplerin blok ataması kaldırılır. Yeni blok oluşturup ekiplere atamanız gerekir.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await completeProjectBlock(projectId, block.id);
      await load();
      setSuccess(`"${block.name}" tamamlandı. Ekipler sayfasından yeni blok atayın.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const active = blocks.filter((b) => b.status === 'active');
  const completed = blocks.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader
        title="Bloklar"
        description="İş alanlarını blok olarak tanımlayın. Ekipler bloğa atanır; onaylı yevmiye otomatik işlenir."
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Yeni blok</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}>Blok adı</label>
            <input
              className={inputClass}
              placeholder="Örn. A Blok, 3. Kat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={saving}>
            Ekle
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          Blok tamamlanınca ekiplerin ataması sıfırlanır.{' '}
          <Link href={`/admin-panel/proje/${projectId}/ekiplar`} className="text-emerald-700 hover:underline">
            Ekipler
          </Link>{' '}
          sayfasından yeni blok atayın.
        </p>
      </div>

      {loading ? (
        <div className={`${cardClass} p-10 text-center text-sm text-slate-500`}>Yükleniyor…</div>
      ) : (
        <>
          <BlockList
            title="Aktif bloklar"
            blocks={active}
            empty="Henüz aktif blok yok."
            onComplete={handleComplete}
            saving={saving}
          />
          {completed.length > 0 && (
            <BlockList title="Tamamlanan bloklar" blocks={completed} readOnly />
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
        <div className={`${cardClass} p-6 text-sm text-slate-500`}>{empty ?? 'Kayıt yok.'}</div>
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
                  Tamamlandı
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
