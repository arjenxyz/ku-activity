'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { WagePolicyForm, emptyWagePolicy } from '@/components/project/WagePolicyForm';
import { cardClass, labelClass } from '@/components/project/ui';
import {
  YEVMIYE_TRIGGER_LABELS,
  normalizeWagePolicy,
  type WagePolicy,
} from '@/types/wage-policy';
import type { ResolvedWagePolicy } from '@/lib/wage-policy-calc';

export default function ProjectWagePolicyPage() {
  const { projectId } = useParams() as { projectId: string };
  const [useCompanyDefault, setUseCompanyDefault] = useState(true);
  const [policy, setPolicy] = useState<WagePolicy>(emptyWagePolicy());
  const [resolved, setResolved] = useState<ResolvedWagePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}/wage-policy`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Yüklenemedi');
        return res.json();
      })
      .then((d) => {
        setResolved(d.resolved ?? null);
        const row = d.projectRow;
        if (row) {
          setUseCompanyDefault(row.useCompanyDefault !== false);
          if (row.policy) setPolicy(normalizeWagePolicy(row.policy));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/wage-policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCompanyDefault,
          policy: useCompanyDefault ? undefined : policy,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Kaydedilemedi');
      const d = await res.json();
      setResolved(d.resolved ?? null);
      setSuccess('Proje politikası güncellendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader
        title="Proje maaş politikası"
        description="Bu şantiye şirket varsayılanını kullanabilir veya kendi kuralını tanımlayabilir."
      />
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <p className="mb-4 text-sm">
        <Link href={`/admin-panel/proje/${projectId}/asgari`} className="text-indigo-600">
          Asgari ekleme sayfasına git →
        </Link>
        {' · '}
        <Link href="/admin-panel/maas-politikasi" className="text-indigo-600">
          Şirket politikası
        </Link>
      </p>

      <div className={`${cardClass} p-4 sm:p-6 mb-6`}>
        <label className={`${labelClass} flex items-center gap-3 cursor-pointer`}>
          <input
            type="checkbox"
            checked={useCompanyDefault}
            onChange={(e) => setUseCompanyDefault(e.target.checked)}
            className="rounded border-slate-300"
          />
          Şirket varsayılan politikasını kullan
        </label>
        {useCompanyDefault && resolved && (
          <ul className="mt-3 text-sm text-slate-600 space-y-1">
            <li>
              Yevmiye:{' '}
              {resolved.yevmiyePaymentTriggers
                .map((t) => YEVMIYE_TRIGGER_LABELS[t])
                .join(', ')}
            </li>
            <li>Kaynak: {resolved.source === 'default' ? 'Henüz doldurulmamış varsayılan' : 'Şirket politikası'}</li>
          </ul>
        )}
      </div>

      {!useCompanyDefault && (
        <WagePolicyForm
          value={policy}
          onChange={setPolicy}
          onSubmit={handleSubmit}
          loading={loading}
          saving={saving}
          title="Bu proje için özel kurallar"
          subtitle="Yalnızca bu şantiye için geçerli ayarlar."
        />
      )}

      {useCompanyDefault && !loading && (
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>
      )}
    </div>
  );
}
