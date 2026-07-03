'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiDownload, FiTrash2, FiUpload } from 'react-icons/fi';
import { DeveloperShell } from '@/components/developer/DeveloperShell';
import {
  APP_RELEASE_LABELS,
  APP_RELEASE_TYPES,
  formatApkFileSize,
  type AppReleaseRow,
  type AppReleaseType,
} from '@/lib/app-releases';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusBadge(status: AppReleaseRow['status']) {
  if (status === 'pending') return { label: 'Onay bekliyor', className: 'bg-amber-900/40 text-amber-300' };
  if (status === 'published') return { label: 'Yayında', className: 'bg-emerald-900/40 text-emerald-300' };
  return { label: 'Arşiv', className: 'bg-slate-700 text-slate-300' };
}

export default function DeveloperReleasesPage() {
  const router = useRouter();
  const [releases, setReleases] = useState<AppReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    appType: 'personnel' as AppReleaseType,
    versionName: '',
    versionCode: '',
    releaseNotes: '',
    file: null as File | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/releases');
      if (res.status === 401) {
        router.replace('/developer-panel/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi');
      setReleases(data.releases ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' });
    router.replace('/developer-panel/login');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) {
      setError('APK dosyası seçin');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const body = new FormData();
      body.set('appType', form.appType);
      body.set('versionName', form.versionName.trim());
      body.set('versionCode', form.versionCode.trim());
      body.set('releaseNotes', form.releaseNotes.trim());
      body.set('file', form.file);

      const res = await fetch('/api/developer/releases', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi');

      setSuccess(data.message || 'APK yüklendi. Yayınlamak için onaylayın.');
      setForm({ appType: 'personnel', versionName: '', versionCode: '', releaseNotes: '', file: null });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Bu sürümü yayınlamak istediğinize emin misiniz? Mevcut yayın arşivlenecek.')) return;

    setPublishingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/developer/releases/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yayınlanamadı');
      setSuccess('Sürüm yayınlandı. APK indirme sayfasında görünür.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yayınlama başarısız');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bekleyen sürümü silmek istediğinize emin misiniz?')) return;

    const res = await fetch(`/api/developer/releases/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Silinemedi');
      return;
    }
    await load();
  };

  const pending = releases.filter((row) => row.status === 'pending');
  const others = releases.filter((row) => row.status !== 'pending');

  return (
    <DeveloperShell onLogout={handleLogout}>
      <h1 className="text-2xl font-bold mb-2">APK Sürümleri</h1>
      <p className="text-sm text-slate-400 mb-8">
        Yeni APK yüklendiğinde önce onay bekler. Sürüm numarası ve değişiklik notlarını kontrol edip{' '}
        <strong className="text-slate-300">Yayınla</strong> dediğinizde indirme sayfasında görünür.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-200 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200 text-sm">
          {success}
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-amber-200">Onay Bekleyen Sürümler</h2>
          <div className="space-y-4">
            {pending.map((row) => {
              const badge = statusBadge(row.status);
              return (
                <article
                  key={row.id}
                  className="rounded-2xl border border-amber-800/50 bg-amber-950/20 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">
                          {APP_RELEASE_LABELS[row.app_type].title} · v{row.version_name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Sürüm kodu {row.version_code} · {formatApkFileSize(row.file_size)} ·{' '}
                        {formatDate(row.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={publishingId === row.id}
                        onClick={() => void handlePublish(row.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-50"
                      >
                        <FiCheck className="w-4 h-4" />
                        {publishingId === row.id ? 'Yayınlanıyor…' : 'Yayınla'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-900/60 text-red-300 hover:bg-red-950/40 text-sm"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </div>
                  </div>

                  {row.release_notes ? (
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Bu sürümde neler var?
                      </p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{row.release_notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Değişiklik notu girilmemiş.</p>
                  )}

                  {row.sha256 && (
                    <p className="text-[11px] text-slate-500 font-mono break-all">SHA-256: {row.sha256}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <form
        onSubmit={handleUpload}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 space-y-4"
      >
        <h2 className="font-semibold flex items-center gap-2">
          <FiUpload className="w-4 h-4" />
          Yeni APK Yükle
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Uygulama</label>
            <select
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              value={form.appType}
              onChange={(e) => setForm((f) => ({ ...f, appType: e.target.value as AppReleaseType }))}
            >
              {APP_RELEASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {APP_RELEASE_LABELS[type].title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sürüm adı (versionName)</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              value={form.versionName}
              onChange={(e) => setForm((f) => ({ ...f, versionName: e.target.value }))}
              placeholder="1.2.0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sürüm kodu (versionCode)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              value={form.versionCode}
              onChange={(e) => setForm((f) => ({ ...f, versionCode: e.target.value }))}
              placeholder="12"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">APK dosyası</label>
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-violet-700 file:px-3 file:py-1 file:text-white file:text-xs"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Değişiklik notları</label>
          <textarea
            rows={4}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            value={form.releaseNotes}
            onChange={(e) => setForm((f) => ({ ...f, releaseNotes: e.target.value }))}
            placeholder="- Yoklama ekranı iyileştirildi&#10;- Bordro görüntüleme hızlandırıldı"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
        >
          {uploading ? 'Yükleniyor…' : 'Yükle (onay bekler)'}
        </button>
        <p className="text-xs text-slate-500">
          CI/CD: Bubblewrap build sonrası{' '}
          <code className="text-violet-300">node scripts/upload-apk.mjs</code> ile otomatik yükleyebilirsiniz.
          Yayın için yine bu panelden onay gerekir.
        </p>
      </form>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold">Sürüm geçmişi</h2>
        </div>
        {loading ? (
          <p className="p-8 text-center text-slate-500">Yükleniyor…</p>
        ) : others.length === 0 && pending.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Henüz APK yüklenmedi.</p>
        ) : others.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Yayınlanmış veya arşivlenmiş sürüm yok.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {others.map((row) => {
              const badge = statusBadge(row.status);
              return (
                <div key={row.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-100">
                        {APP_RELEASE_LABELS[row.app_type].title} · v{row.version_name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Kod {row.version_code} · {formatApkFileSize(row.file_size)} · Yayın:{' '}
                      {formatDate(row.published_at)}
                    </p>
                  </div>
                  {row.status === 'published' && (
                    <a
                      href={`/api/public/releases/${row.app_type}/download`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 px-2 py-1"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      İndir
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DeveloperShell>
  );
}
