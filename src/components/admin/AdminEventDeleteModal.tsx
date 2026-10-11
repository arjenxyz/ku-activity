'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export function AdminEventDeleteModal({
  eventTitle,
  eventId,
  onClose,
  onDeleted,
}: {
  eventTitle: string;
  eventId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(true);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/admin/events/delete-challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId }),
        });
        const payload = (await response.json().catch(() => null)) as {
          code?: string;
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Onay kodu alınamadı');
        }
        if (!cancelled) setChallenge(payload?.code ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Onay kodu alınamadı');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    if (typed.trim() !== challenge) {
      setError('Kod eşleşmiyor');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, confirmCode: typed.trim() }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Silinemedi');
      }
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <form
        data-scroll-lock-allow=""
        onSubmit={(e) => void onSubmit(e)}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FiAlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-[#0E1548]">
                Etkinliği sil
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                <span className="font-medium text-slate-700">{eventTitle}</span> ve bu etkinliğe ait
                kayıt / ödeme verileri kalıcı olarak silinir. Diğer etkinlikler etkilenmez.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            disabled={busy}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Onay kodu
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.35em] text-[#0E1548]">
            {challenge ?? '······'}
          </p>
        </div>

        <label htmlFor="delete-confirm-code" className="mt-3 block text-xs font-medium text-slate-600">
          Kodu yazarak onayla
        </label>
        <input
          id="delete-confirm-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={typed}
          disabled={!challenge || busy}
          onChange={(e) => setTyped(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="······"
          className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-center font-mono text-lg tracking-[0.35em] outline-none focus:border-red-400 disabled:opacity-50"
        />

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={busy || !challenge || typed.length !== 6}
            className="h-10 flex-1 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Siliniyor…' : 'Sil'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
