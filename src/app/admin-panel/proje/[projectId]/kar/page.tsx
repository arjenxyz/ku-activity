'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import {
  addProjectPartner,
  createProjectJob,
  deleteProjectJob,
  deleteProjectPartner,
  fetchProjectProfit,
  updateProfitShareCount,
  updateProjectJob,
} from '@/lib/project-api';
import { computeContractTotal } from '@/lib/job-profit';
import type { ProjectProfitOverview } from '@/types/project-job';
import { PROJECT_JOB_STATUS_LABELS } from '@/types/project-job';

export default function KarPage() {
  const { projectId } = useParams() as { projectId: string };
  const [overview, setOverview] = useState<ProjectProfitOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState('1');
  const [partnerName, setPartnerName] = useState('');
  const [jobForm, setJobForm] = useState({
    name: '',
    unitLabel: 'm²',
    unitPrice: '',
    quantity: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchProjectProfit(projectId);
      setOverview(data);
      setShareCount(String(data.settings.share_count));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const previewTotal =
    jobForm.unitPrice && jobForm.quantity
      ? Number(jobForm.unitPrice) * Number(jobForm.quantity)
      : null;

  const handleShareSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { overview: next } = await updateProfitShareCount(projectId, Number(shareCount));
      setOverview(next);
      setSuccess('Ortak payı güncellendi.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addProjectPartner(projectId, partnerName.trim());
      setPartnerName('');
      await load();
      setSuccess('Ortak eklendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ortak eklenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteProjectPartner(projectId, partnerId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { overview: next } = await createProjectJob(projectId, {
        name: jobForm.name,
        unitLabel: jobForm.unitLabel,
        unitPrice: Number(jobForm.unitPrice),
        quantity: Number(jobForm.quantity),
        notes: jobForm.notes || undefined,
      });
      setOverview(next);
      setJobForm({ name: '', unitLabel: 'm²', unitPrice: '', quantity: '', notes: '' });
      setSuccess('İş kalemi eklendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İş kalemi eklenemedi');
    } finally {
      setSaving(false);
    }
  };

  const toggleJobStatus = async (jobId: string, current: 'active' | 'completed') => {
    setSaving(true);
    setError(null);
    try {
      const nextStatus = current === 'active' ? 'completed' : 'active';
      const { overview: next } = await updateProjectJob(projectId, jobId, { status: nextStatus });
      setOverview(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Bu iş kalemini silmek istediğinize emin misiniz? Bağlı yevmiyeler iş kaleminden ayrılır.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { overview: next } = await deleteProjectJob(projectId, jobId);
      setOverview(next);
      setSuccess('İş kalemi silindi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectPageHeader
        title="Taşeron Karı"
        description="Üst taşerondan aldığınız işin bedeli − işçi yevmiyeleri = kâr. Personel panelini etkilemez."
      />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      {loading ? (
        <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>Yükleniyor…</div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`${cardClass} p-6 lg:col-span-2 bg-emerald-900 text-white`}>
              <p className="text-sm text-emerald-200">Proje toplam kâr (onaylı yevmiye)</p>
              <p className="text-3xl font-bold mt-2">{formatMoney(overview.totals.profitApproved)}</p>
              <p className="text-xs text-emerald-300 mt-2">
                Alınan iş: {formatMoney(overview.totals.contractTotal)} − işçi:{' '}
                {formatMoney(overview.totals.laborCostApproved)}
              </p>
            </div>
            <div className={`${cardClass} p-6 bg-slate-800 text-white`}>
              <p className="text-sm text-slate-300">Ortak başı kâr</p>
              <p className="text-3xl font-bold mt-2">
                {formatMoney(overview.totals.profitPerShareApproved)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {overview.totals.shareCount} kişiye eşit bölüşüm
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${cardClass} p-5`}>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Ortak paylaşımı</h2>
              <p className="text-xs text-slate-500 mb-4">
                Siz dahil kaç kişi kârı eşit paylaşacak? (Örn. siz + 1 ortak = 2)
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className={labelClass}>Kişi sayısı</label>
                  <select
                    className={inputClass}
                    value={shareCount}
                    onChange={(e) => setShareCount(e.target.value)}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={saving}
                  onClick={handleShareSave}
                >
                  Kaydet
                </button>
              </div>
              <form onSubmit={handleAddPartner} className="mt-4 flex flex-wrap gap-2">
                <input
                  className={`${inputClass} flex-1 min-w-[140px]`}
                  placeholder="Ortak adı (isteğe bağlı etiket)"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
                <button type="submit" className={btnSecondary} disabled={saving}>
                  Ortak ekle
                </button>
              </form>
              {overview.partners.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {overview.partners.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 rounded px-3 py-2"
                    >
                      <span>{p.name}</span>
                      <button
                        type="button"
                        className="text-red-600 text-xs hover:underline"
                        onClick={() => handleRemovePartner(p.id)}
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleAddJob} className={`${cardClass} p-5`}>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Yeni iş kalemi</h2>
              <p className="text-xs text-slate-500 mb-4">
                Örn. çatı 100 ₺/m² × 890 m² — toplam alacak otomatik hesaplanır.
              </p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>İş adı</label>
                  <input
                    className={inputClass}
                    required
                    placeholder="Çatı"
                    value={jobForm.name}
                    onChange={(e) => setJobForm((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Birim fiyat (₺)</label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="100"
                      value={jobForm.unitPrice}
                      onChange={(e) => setJobForm((s) => ({ ...s, unitPrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Miktar</label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="890"
                      value={jobForm.quantity}
                      onChange={(e) => setJobForm((s) => ({ ...s, quantity: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Birim</label>
                  <input
                    className={inputClass}
                    value={jobForm.unitLabel}
                    onChange={(e) => setJobForm((s) => ({ ...s, unitLabel: e.target.value }))}
                  />
                </div>
                {previewTotal != null && !Number.isNaN(previewTotal) && (
                  <p className="text-sm font-medium text-emerald-700">
                    Toplam alacak: {formatMoney(previewTotal)}
                  </p>
                )}
                <button type="submit" className={btnPrimary} disabled={saving}>
                  İş kalemi ekle
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">İş kalemleri</h2>
              <Link
                href={`/admin-panel/proje/${projectId}/yevmiye`}
                className="text-sm text-blue-600 hover:underline"
              >
                Yevmiye girerken iş kalemi seç →
              </Link>
            </div>

            {overview.jobs.length === 0 ? (
              <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
                Henüz iş kalemi yok. Üst taşerondan aldığınız işi yukarıdan ekleyin.
              </div>
            ) : (
              overview.jobs.map((item) => {
                const { job } = item;
                const contract = computeContractTotal(job);
                return (
                  <div key={job.id} className={`${cardClass} overflow-hidden`}>
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{job.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              job.status === 'completed'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {PROJECT_JOB_STATUS_LABELS[job.status]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatMoney(job.unit_price)} / {job.unit_label} × {job.quantity}{' '}
                          {job.unit_label} = <strong>{formatMoney(contract)}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={btnSecondary}
                          disabled={saving}
                          onClick={() => toggleJobStatus(job.id, job.status)}
                        >
                          {job.status === 'active' ? 'Tamamlandı işaretle' : 'Yeniden aç'}
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline px-2"
                          disabled={saving}
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
                      {[
                        { label: 'İşçi yevmiyesi (onaylı)', value: formatMoney(item.laborCostApproved) },
                        { label: 'Kâr', value: formatMoney(item.profitApproved) },
                        { label: 'Ortak başı', value: formatMoney(item.profitPerShareApproved) },
                        {
                          label: 'Onaylı gün',
                          value: `${item.approvedWorkDays} gün`,
                        },
                      ].map((cell) => (
                        <div key={cell.label} className="bg-white p-4">
                          <p className="text-xs text-slate-500">{cell.label}</p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">{cell.value}</p>
                        </div>
                      ))}
                    </div>
                    {item.pendingWorkDays > 0 && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-5 py-2">
                        {item.pendingWorkDays} gün onay bekliyor — onaylanınca işçi maliyeti{' '}
                        {formatMoney(item.laborCostPending)} olabilir (tahmini kâr:{' '}
                        {formatMoney(item.profitPending)})
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
