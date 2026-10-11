'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

type Payload = {
  sponsors?: StoredSponsor[];
  error?: string;
};

export function AdminSponsorsPanel() {
  const [sponsors, setSponsors] = useState<StoredSponsor[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [url, setUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/sponsors', { cache: 'no-store' });
    const payload = (await response.json().catch(() => null)) as Payload | null;
    if (!response.ok) {
      setError(payload?.error ?? 'Sponsorlar yüklenemedi');
      setReady(true);
      return;
    }
    setSponsors(payload?.sponsors ?? []);
    setError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, blurb, url, logoUrl }),
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Eklenemedi');
      setSponsors(payload?.sponsors ?? []);
      setName('');
      setBlurb('');
      setUrl('');
      setLogoUrl('');
      setMessage('Sponsor eklendi. Ana sayfada kaydırma şeridinde görünür.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/sponsors?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Silinemedi');
      setSponsors(payload?.sponsors ?? []);
      setMessage('Sponsor kaldırıldı.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-base font-semibold tracking-tight text-[#0E1548]">Sponsorlar</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Ana sayfadaki kaydırılabilir şerit. Örn. Abana Seyahat, Abana Belediyesi.
        </p>
      </header>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {!ready ? (
          <li className="px-3 py-5 text-center text-xs text-slate-500">Yükleniyor…</li>
        ) : sponsors.length === 0 ? (
          <li className="px-3 py-5 text-center text-xs text-slate-500">Henüz sponsor yok.</li>
        ) : (
          sponsors.map((sponsor) => (
            <li key={sponsor.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-xs font-semibold text-white">
                {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0E1548]">{sponsor.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {sponsor.blurb || 'Sponsor'}
                  {sponsor.url ? ` · ${sponsor.url}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRemove(sponsor.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`${sponsor.name} kaldır`}
              >
                <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={(e) => void onCreate(e)}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <FiPlus className="h-3 w-3" aria-hidden />
          Sponsor ekle
        </p>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ad (ör. Abana Seyahat)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="Kısa not (ör. Ulaşım sponsoru)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Web sitesi (isteğe bağlı)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="Logo URL (isteğe bağlı)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="h-9 w-full rounded-lg bg-[#0E1548] text-xs font-semibold text-white disabled:opacity-50"
        >
          Ekle
        </button>
      </form>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
