'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiCopy, FiPlus, FiTrash2 } from 'react-icons/fi';
import { DeveloperShell } from '@/components/developer/DeveloperShell';
import { WIPE_CONFIRM_PHRASE } from '@/lib/developer-wipe';

import { formatString } from '@/lib/strings/format';

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

  const strings = useRegistryStrings('app/developer-panel/page');
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
      if (!res.ok) throw new Error(data.error || strings.loadFailed);
      setCodes(data.codes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.genericError);
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
      if (!res.ok) throw new Error(data.error || strings.createFailed);
      setLastCreated(data.code?.code as string);
      setForm({ label: '', requestEmail: '', notes: '', expiresDays: '90' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.genericError);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(strings.revokeConfirm)) return;
    const res = await fetch(`/api/developer/codes/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleWipeDatabase = async () => {
    if (wipePhrase.trim() !== WIPE_CONFIRM_PHRASE) {
      setError(formatString(strings.wipePhraseHint, { phrase: WIPE_CONFIRM_PHRASE }));
      return;
    }
    if (!confirm(strings.wipeFinalConfirm)) {
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
      if (!res.ok) throw new Error(data.error || strings.wipeFailed);
      setWipeResult(strings.wipeSuccess);
      setWipeOpen(false);
      setWipePhrase('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.wipeDeleteFailed);
    } finally {
      setWiping(false);
    }
  };

  const statusOf = (row: CodeRow) => {
    if (row.revoked_at) return { label: strings.statusRevoked, className: 'bg-red-900/40 text-red-300' };
    if (row.redeemed_at) return { label: strings.statusRedeemed, className: 'bg-slate-700 text-slate-300' };
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { label: strings.statusExpired, className: 'bg-amber-900/40 text-amber-300' };
    }
    return { label: strings.statusActive, className: 'bg-emerald-900/40 text-emerald-300' };
  };

  return (
    <DeveloperShell onLogout={handleLogout}>
      <h1 className="text-2xl font-bold mb-2">{strings.title}</h1>
      <p className="text-sm text-slate-400 mb-8">{strings.subtitle}</p>

      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          {strings.newCodeTitle}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{strings.labelField}</label>
            <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder={strings.labelPlaceholder} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{strings.requestEmailField}</label>
            <input type="email" className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.requestEmail} onChange={(e) => setForm((f) => ({ ...f, requestEmail: e.target.value }))} placeholder={strings.requestEmailPlaceholder} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{strings.expiresDaysField}</label>
            <input type="number" min={1} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.expiresDays} onChange={(e) => setForm((f) => ({ ...f, expiresDays: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{strings.notesField}</label>
            <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <button type="submit" disabled={creating} className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50">
          {creating ? strings.creating : strings.createCode}
        </button>
        {lastCreated && (
          <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between gap-2">
            <span>
              {strings.newCodeCreated} <strong className="font-mono">{lastCreated}</strong>
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
          <p className="p-8 text-center text-slate-500">{strings.loading}</p>
        ) : codes.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{strings.noCodes}</p>
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
                      {row.projects?.name ? ` · ${formatString(strings.projectPrefix, { name: row.projects.name })}` : ''}
                    </p>
                  </div>
                  {!row.redeemed_at && !row.revoked_at && (
                    <button type="button" onClick={() => handleRevoke(row.id)} className="shrink-0 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1">
                      <FiTrash2 className="w-3.5 h-3.5" />
                      {strings.revoke}
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
            {strings.dangerZoneTitle}
          </h2>
          <p className="text-xs text-red-300/80 mt-1">{strings.dangerZoneDescription}</p>
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
              {strings.wipeAllData}
            </button>
          ) : (
            <div className="space-y-3 max-w-md">
              <p className="text-sm text-slate-300">
                {strings.wipeConfirmPromptBefore}{' '}
                <code className="text-red-300 font-mono text-xs bg-slate-950 px-1.5 py-0.5 rounded">
                  {WIPE_CONFIRM_PHRASE}
                </code>{' '}
                {strings.wipeConfirmPromptAfter}
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
                  {wiping ? strings.wiping : strings.wipePermanently}
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
                  {strings.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </DeveloperShell>
  );
}
