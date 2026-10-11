'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiUserPlus } from 'react-icons/fi';
import type { AssignablePerson, StoredTeamMember } from '@/lib/team/members-store';

type Payload = {
  members?: StoredTeamMember[];
  assignable?: AssignablePerson[];
  error?: string;
};

export function AdminTeamRoster() {
  const [members, setMembers] = useState<StoredTeamMember[]>([]);
  const [assignable, setAssignable] = useState<AssignablePerson[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [manualName, setManualName] = useState('');
  const [manualRole, setManualRole] = useState('');
  const [manualAbout, setManualAbout] = useState('');
  const [personId, setPersonId] = useState('');
  const [assignRole, setAssignRole] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/team/members');
    const payload = (await response.json().catch(() => null)) as Payload | null;
    if (!response.ok) {
      setError(payload?.error ?? 'Üyeler yüklenemedi');
      setReady(true);
      return;
    }
    setMembers(payload?.members ?? []);
    setAssignable(payload?.assignable ?? []);
    setError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function applyPayload(payload: Payload) {
    setMembers(payload.members ?? []);
    setAssignable(payload.assignable ?? []);
  }

  async function onManual(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          name: manualName,
          role: manualRole,
          about: manualAbout,
        }),
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Eklenemedi');
      applyPayload(payload ?? {});
      setManualName('');
      setManualRole('');
      setManualAbout('');
      setMessage('Üye eklendi. /ekip sayfasında görünür.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!personId) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          personId,
          role: assignRole,
        }),
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Atanamadı');
      applyPayload(payload ?? {});
      setPersonId('');
      setAssignRole('');
      setMessage('Kayıtlı kullanıcı ekibe atandı.');
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
      const response = await fetch(`/api/admin/team/members?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) throw new Error(payload?.error ?? 'Silinemedi');
      applyPayload(payload ?? {});
      setMessage('Üye listeden kaldırıldı.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="py-4 text-center text-sm text-slate-500">Üyeler yükleniyor…</p>;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#0E1548]">Ekip üyeleri</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          /ekip sayfasındaki yüzler. Manuel ekle veya kayıtlı kişiyi ata.
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {members.length === 0 ? (
          <li className="px-3 py-5 text-center text-xs text-slate-500">Henüz üye yok.</li>
        ) : (
          members.map((member) => (
            <li key={member.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-xs font-semibold text-white">
                {member.name.slice(0, 1).toLocaleUpperCase('tr')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0E1548]">{member.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {member.role} · {member.handle}
                  {member.profileKey ? ' · kayıtlı' : ' · manuel'}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onRemove(member.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`${member.name} kaldır`}
              >
                <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={(e) => void onManual(e)}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <FiPlus className="h-3 w-3" aria-hidden />
          Manuel ekle
        </p>
        <input
          required
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="Ad"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <input
          value={manualRole}
          onChange={(e) => setManualRole(e.target.value)}
          placeholder="Rol (ör. Kayıt onayı)"
          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <textarea
          rows={2}
          value={manualAbout}
          onChange={(e) => setManualAbout(e.target.value)}
          placeholder="Kısa açıklama"
          className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#2D6AF6]"
        />
        <button
          type="submit"
          disabled={busy || !manualName.trim()}
          className="h-9 w-full rounded-lg bg-[#0E1548] text-xs font-semibold text-white disabled:opacity-50"
        >
          Üye ekle
        </button>
      </form>

      <form
        onSubmit={(e) => void onAssign(e)}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <FiUserPlus className="h-3 w-3" aria-hidden />
          Kayıtlı kişiyi ata
        </p>
        {assignable.length === 0 ? (
          <p className="text-xs text-slate-500">
            Atanabilir kişi yok. Demo hesaplar veya kabul edilmiş başvurular burada listelenir.
          </p>
        ) : (
          <>
            <select
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
            >
              <option value="">Kişi seç…</option>
              {assignable.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.fullName} · {person.email}
                  {person.source === 'application' ? ' (başvuru)' : ''}
                </option>
              ))}
            </select>
            <input
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              placeholder="Rol (isteğe bağlı)"
              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-[#2D6AF6]"
            />
            <button
              type="submit"
              disabled={busy || !personId}
              className="h-9 w-full rounded-lg border border-slate-200 text-xs font-semibold text-[#0E1548] hover:bg-slate-50 disabled:opacity-50"
            >
              Ekibe ata
            </button>
          </>
        )}
      </form>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
