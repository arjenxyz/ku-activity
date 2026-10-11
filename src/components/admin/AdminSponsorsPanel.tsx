'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import type { StoredSponsor } from '@/lib/sponsors/sponsors-store';

type Payload = {
  sponsors?: StoredSponsor[];
  error?: string;
};

const MAX_IMAGE_BYTES = 900_000;

async function fileToDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnızca görsel dosyası seç');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Görsel en fazla ~900 KB olmalı');
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Görsel okunamadı'));
    reader.readAsDataURL(file);
  });
}

type FormState = {
  name: string;
  blurb: string;
  about: string;
  url: string;
  logoUrl: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  blurb: '',
  about: '',
  url: '',
  logoUrl: '',
};

export function AdminSponsorsPanel() {
  const [sponsors, setSponsors] = useState<StoredSponsor[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

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

  function startEdit(sponsor: StoredSponsor) {
    setEditingId(sponsor.id);
    setForm({
      name: sponsor.name,
      blurb: sponsor.blurb ?? '',
      about: sponsor.about ?? '',
      url: sponsor.url ?? '',
      logoUrl: sponsor.logoUrl ?? '',
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onImagePick(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Görsel yüklenemedi');
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/sponsors', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId ?? undefined,
          name: form.name,
          blurb: form.blurb,
          about: form.about,
          url: form.url,
          logoUrl: form.logoUrl,
        }),
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Kaydedilemedi');
      setSponsors(payload?.sponsors ?? []);
      resetForm();
      setMessage(editingId ? 'Sponsor güncellendi.' : 'Sponsor eklendi. Ana sayfada görünür.');
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
      if (editingId === id) resetForm();
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
          Ana sayfa ızgarası. Tıklanınca modalda detay, web sitesi ve görsel görünür.
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
              {sponsor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sponsor.logoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg bg-[#f4f8fd] object-contain p-1"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0E1548] text-xs font-semibold text-white">
                  {sponsor.name.slice(0, 1).toLocaleUpperCase('tr')}
                </span>
              )}
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
                onClick={() => startEdit(sponsor)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[#e8f0ff] hover:text-[#2D6AF6] disabled:opacity-50"
                aria-label={`${sponsor.name} düzenle`}
              >
                <FiEdit2 className="h-3.5 w-3.5" aria-hidden />
              </button>
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
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {editingId ? <FiEdit2 className="h-3 w-3" aria-hidden /> : <FiPlus className="h-3 w-3" aria-hidden />}
            {editingId ? 'Sponsor düzenle' : 'Sponsor ekle'}
          </p>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#0E1548]"
            >
              <FiX className="h-3 w-3" aria-hidden />
              İptal
            </button>
          ) : null}
        </div>

        <input
          required
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ad (ör. Abana Seyahat)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={form.blurb}
          onChange={(e) => setForm((prev) => ({ ...prev, blurb: e.target.value }))}
          placeholder="Kısa etiket (ör. Ulaşım sponsoru)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <textarea
          rows={3}
          value={form.about}
          onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
          placeholder="Detay metni (modalda görünür)"
          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={form.url}
          onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
          placeholder="Web sitesi (ör. https://...)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <FiImage className="h-3 w-3" aria-hidden />
            Görsel
          </p>
          {form.logoUrl ? (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.logoUrl}
                alt=""
                className="h-14 w-20 rounded-lg bg-white object-contain ring-1 ring-slate-200"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                className="text-[11px] font-medium text-red-600"
              >
                Kaldır
              </button>
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = '';
              void onImagePick(file);
            }}
            className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0E1548] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <input
            value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="veya görsel URL / yolu"
            className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !form.name.trim()}
          className="h-9 w-full rounded-lg bg-[#0E1548] text-xs font-semibold text-white disabled:opacity-50"
        >
          {editingId ? 'Kaydet' : 'Ekle'}
        </button>
      </form>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
