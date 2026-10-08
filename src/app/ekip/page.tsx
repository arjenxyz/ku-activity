'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { memberInitials, TEAM_MEMBERS, type TeamMember } from '@/lib/team';
import { createClient } from '@/utils/supabase/client';

function Portrait({ member, className }: { member: TeamMember; className: string }) {
  if (member.image) {
    return <img src={member.image} alt="" className={`${className} object-cover`} />;
  }
  return (
    <span className={`${className} flex items-center justify-center bg-[#1c2a44] text-2xl font-semibold text-white`}>
      {memberInitials(member.name)}
    </span>
  );
}

function browserSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient();
}

export default function TeamPage() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState<{ id: string; title: string; description: string | null } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [note, setNote] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyDone, setApplyDone] = useState(false);

  useBodyScrollLock(selected !== null || applyOpen);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) return;
    void (async () => {
      const { data: openings } = await supabase
        .from('team_openings')
        .select('id, title, description')
        .eq('is_open', true)
        .order('created_at', { ascending: false })
        .limit(1);
      const current = openings?.[0] ?? null;
      setOpening(current);
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!current || !user) return;
      const { data: mine } = await supabase
        .from('team_applications')
        .select('id')
        .eq('opening_id', current.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      setApplied(Boolean(mine));
    })();
  }, [applyDone]);

  async function submitApplication() {
    if (!opening || !userId) return;
    setApplyError(null);
    const supabase = browserSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('team_applications').insert({
      opening_id: opening.id,
      profile_id: userId,
      note: note.trim() || null,
    });
    if (error) {
      setApplyError(error.message);
      return;
    }
    setApplied(true);
    setApplyDone(true);
    setApplyOpen(false);
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B1220] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold">Ekip</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-400">
          Kayıt onayı ve şifre sıfırlama için görüşeceğin ekip.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3">
          {TEAM_MEMBERS.map((member) => (
            <li key={member.handle}>
              <button
                type="button"
                onClick={() => setSelected(member)}
                className="flex w-full flex-col items-center rounded-2xl bg-[#121A2B] px-3 py-6 text-center"
              >
                <Portrait member={member} className="h-28 w-28 rounded-full" />
                <span className="mt-4 text-sm font-medium">{member.name}</span>
              </button>
            </li>
          ))}
          {opening ? (
            <li>
              {applied ? (
                <div className="flex h-full min-h-44 flex-col items-center justify-center rounded-2xl bg-[#121A2B] px-3 py-6 text-center">
                  <span className="text-sm font-medium text-slate-300">Başvurdun</span>
                </div>
              ) : userId ? (
                <button
                  type="button"
                  onClick={() => setApplyOpen(true)}
                  className="flex h-full min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-[#121A2B] px-3 py-6 text-center"
                >
                  <span className="text-sm font-semibold">Apply</span>
                  <span className="mt-1 text-xs text-slate-400">{opening.title}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex h-full min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-[#121A2B] px-3 py-6 text-center"
                >
                  <span className="text-sm font-semibold">Apply</span>
                  <span className="mt-1 text-xs text-slate-400">Giriş yap</span>
                </Link>
              )}
            </li>
          ) : TEAM_MEMBERS.length === 0
            ? [0, 1, 2, 3].map((slot) => (
                <li key={slot}>
                  <div className="flex flex-col items-center rounded-2xl bg-[#121A2B] px-3 py-6">
                    <span className="h-28 w-28 rounded-full border border-dashed border-slate-600" />
                  </div>
                </li>
              ))
            : null}
        </ul>
      </div>
      {mounted && selected
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-member-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              <section
                className="relative w-full max-w-sm rounded-3xl bg-[#121A2B] px-6 pb-8 pt-5 text-center text-white shadow-2xl ring-1 ring-white/10"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 text-left">
                  <h2 id="team-member-title" className="text-xl font-semibold">{selected.name}</h2>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-left text-sm text-slate-400">{selected.handle}</p>
                <Portrait member={selected} className="mx-auto mt-6 h-40 w-40 rounded-full" />
                <p className="mt-6 text-sm leading-relaxed text-slate-300">{selected.about}</p>
                {selected.role ? <p className="mt-3 text-xs font-medium text-[#8EB4FF]">{selected.role}</p> : null}
              </section>
            </div>,
            document.body,
          )
        : null}
      {mounted && applyOpen && opening
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-apply-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
              onClick={() => setApplyOpen(false)}
            >
              <section
                className="w-full max-w-sm rounded-3xl bg-[#121A2B] p-6 text-white shadow-2xl ring-1 ring-white/10"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="team-apply-title" className="text-lg font-semibold">{opening.title}</h2>
                {opening.description ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{opening.description}</p> : null}
                <label htmlFor="apply-note" className="mt-4 block text-sm text-slate-400">Kısa not</label>
                <textarea
                  id="apply-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm"
                />
                {applyError ? <p className="mt-2 text-sm text-red-300">{applyError}</p> : null}
                <button type="button" onClick={() => void submitApplication()} className="mt-4 w-full rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-[#0B1220]">
                  Başvur
                </button>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
