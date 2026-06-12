'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiCopy, FiPlus, FiTrash2 } from 'react-icons/fi';
import { DeveloperShell } from '@/components/developer/DeveloperShell';

const WIPE_CONFIRM_PHRASE = 'TUM VERILERI SIL';

type CodeRow = {
  id: string;
  code: string;
  label: string | null;
  request_email: string | null;
  notes: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  created_at: string;
  projects?: { name: string } | null;
};

export default function DeveloperPanelPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    requestEmail: '',
    notes: '',
    expiresDays: '90',
  });
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipePhrase, setWipePhrase] = useState('');
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/codes');
      if (res.status === 401) {
        router.replace('/developer-panel/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi');
      setCodes(data.codes ?? []);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setLastCreated(null);
    try {
      const res = await fetch('/api/developer/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label || undefined,
          requestEmail: form.requestEmail || undefined,
          notes: form.notes || undefined,
          expiresDays: Number(form.expiresDays) || 90,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Oluşturulamadı');
      setLastCreated(data.code?.code as string);
      setForm({ label: '', requestEmail: '', notes: '', expiresDays: '90' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Bu kodu iptal etmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/developer/codes/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleWipeDatabase = async () => {
    if (wipePhrase.trim() !== WIPE_CONFIRM_PHRASE) {
      setError(`Onay için kutucuğa tam olarak şunu yazın: ${WIPE_CONFIRM_PHRASE}`);
      return;
    }
    if (
      !confirm(
        'Son uyarı: Tüm projeler, personel, başvurular, yevmiyeler ve fotoğraflar kalıcı olarak silinecek. Devam?'
      )
    ) {
      return;
    }

    setWiping(true);
    setError(null);
    setWipeResult(null);
    try {
      const res = await fetch('/api/developer/wipe-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: wipePhrase.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Silinemedi');
      setWipeResult('Tüm uygulama verileri sıfırlandı. Developer hesabınız ve sözleşme şablonları korundu.');
      setWipeOpen(false);
      setWipePhrase('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme başarısız');
    } finally {
      setWiping(false);
    }
  };

  const statusOf = (row: CodeRow) => {
    if (row.revoked_at) return { label: 'İptal', className: 'bg-red-900/40 text-red-300' };
    if (row.redeemed_at) return { label: 'Kullanıldı', className: 'bg-slate-700 text-slate-300' };
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { label: 'Süresi doldu', className: 'bg-amber-900/40 text-amber-300' };
    }
    return { label: 'Aktif', className: 'bg-emerald-900/40 text-emerald-300' };
  };

  return (
    <DeveloperShell onLogout={handleLogout}>
      <h1 className="text-2xl font-bold mb-2">Doğrulama Kodları</h1>
      <p className="text-sm text-slate-400 mb-8">
        E-posta ile talep eden müşterilere proje başına bir kod üretin. Her kod tek projede kullanılır.
      </p>

      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Yeni Kod Oluştur
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Etiket / Firma</label>
            <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Örn. ABC İnşaat" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Talep e-postası</label>
            <input type="email" className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.requestEmail} onChange={(e) => setForm((f) => ({ ...f, requestEmail: e.target.value }))} placeholder="musteri@firma.com" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Geçerlilik (gün)</label>
            <input type="number" min={1} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.expiresDays} onChange={(e) => setForm((f) => ({ ...f, expiresDays: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Not</label>
            <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <button type="submit" disabled={creating} className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50">
          {creating ? 'Oluşturuluyor…' : 'Kod Üret'}
        </button>
        {lastCreated && (
          <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between gap-2">
            <span>
              Yeni kod: <strong className="font-mono">{lastCreated}</strong>
            </span>
            <button type="button" onClick={() => copyCode(lastCreated)} className="p-1.5 rounded hover:bg-emerald-800/50">
              <FiCopy />
            </button>
          </div>
        )}
      </form>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-200 text-sm">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Yükleniyor…</p>
        ) : codes.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Henüz kod yok.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {codes.map((row) => {
              const st = statusOf(row);
              return (
                <div key={row.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono text-violet-300 font-semibold">{row.code}</code>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {row.label || '—'}
                      {row.request_email ? ` · ${row.request_email}` : ''}
                      {row.projects?.name ? ` · Proje: ${row.projects.name}` : ''}
                    </p>
                  </div>
                  {!row.redeemed_at && !row.revoked_at && (
                    <button type="button" onClick={() => handleRevoke(row.id)} className="shrink-0 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1">
                      <FiTrash2 className="w-3.5 h-3.5" />
                      İptal
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <section className="mt-10 border border-red-900/50 rounded-2xl overflow-hidden">
        <div className="bg-red-950/40 px-5 py-4 border-b border-red-900/50">
          <h2 className="font-semibold text-red-200 flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4" />
            Tehlikeli Bölge
          </h2>
          <p className="text-xs text-red-300/80 mt-1">
            Tüm projeler, personel, başvurular, OTP, yevmiye, bordro, doğrulama kodları ve storage
            fotoğrafları silinir. Developer girişi ve sözleşme şablonları kalır.
          </p>
        </div>
        <div className="p-5 space-y-4">
          {wipeResult && (
            <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200 text-sm">
              {wipeResult}
            </div>
          )}
          {!wipeOpen ? (
            <button
              type="button"
              onClick={() => {
                setWipeOpen(true);
                setWipePhrase('');
                setWipeResult(null);
              }}
              className="px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-medium text-white"
            >
              Tüm Supabase Verilerini Sil
            </button>
          ) : (
            <div className="space-y-3 max-w-md">
              <p className="text-sm text-slate-300">
                Onaylamak için{' '}
                <code className="text-red-300 font-mono text-xs bg-slate-950 px-1.5 py-0.5 rounded">
                  {WIPE_CONFIRM_PHRASE}
                </code>{' '}
                yazın:
              </p>
              <input
                className="w-full rounded-lg bg-slate-950 border border-red-900/60 px-3 py-2 text-sm font-mono"
                value={wipePhrase}
                onChange={(e) => setWipePhrase(e.target.value)}
                placeholder={WIPE_CONFIRM_PHRASE}
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={wiping || wipePhrase.trim() !== WIPE_CONFIRM_PHRASE}
                  onClick={() => void handleWipeDatabase()}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-medium disabled:opacity-50 text-white"
                >
                  {wiping ? 'Siliniyor…' : 'Kalıcı Olarak Sil'}
                </button>
                <button
                  type="button"
                  disabled={wiping}
                  onClick={() => {
                    setWipeOpen(false);
                    setWipePhrase('');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </DeveloperShell>
  );
}
