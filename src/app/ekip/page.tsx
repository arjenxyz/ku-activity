'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { HomeHeader } from '@/components/home/HomeHeader';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { memberInitials, TEAM_MEMBERS, type TeamMember } from '@/lib/team';
import { createClient } from '@/utils/supabase/client';

function Portrait({ member, className }: { member: TeamMember; className: string }) {
  if (member.image) {
    return <img src={member.image} alt="" className={`${className} object-cover`} />;
  }
  return (
    <span className={`${className} flex items-center justify-center bg-[#0E1548] text-2xl font-semibold text-white`}>
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-white via-[#f7fbff] to-white px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+1.5rem)] text-slate-900">
      <HomeHeader />
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Ekip</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-500">
          Kayıt onayı ve şifre sıfırlama için görüşeceğin ekip.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3">
          {TEAM_MEMBERS.map((member) => (
            <li key={member.handle}>
              <button
                type="button"
                onClick={() => setSelected(member)}
                className="flex w-full flex-col items-center rounded-2xl bg-white px-3 py-6 text-center shadow-sm ring-1 ring-slate-200 transition hover:bg-[#e8f0ff] hover:ring-[#2D6AF6]/30"
              >
                <Portrait member={member} className="h-28 w-28 rounded-full" />
                <span className="mt-4 text-sm font-medium text-[#0E1548]">{member.name}</span>
              </button>
            </li>
          ))}
          {opening ? (
            <li>
              {applied ? (
                <div className="flex h-full min-h-44 flex-col items-center justify-center rounded-2xl bg-white px-3 py-6 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="text-sm font-medium text-slate-500">Başvurdun</span>
                </div>
              ) : userId ? (
                <button
                  type="button"
                  onClick={() => setApplyOpen(true)}
                  className="flex h-full min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-[#0E1548] transition hover:bg-[#e8f0ff] hover:border-[#2D6AF6]/40"
                >
                  <span className="text-sm font-semibold">Apply</span>
                  <span className="mt-1 text-xs text-slate-500">{opening.title}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex h-full min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-[#0E1548] transition hover:bg-[#e8f0ff] hover:border-[#2D6AF6]/40"
                >
                  <span className="text-sm font-semibold">Apply</span>
                  <span className="mt-1 text-xs text-slate-500">Giriş yap</span>
                </Link>
              )}
            </li>
          ) : TEAM_MEMBERS.length === 0
            ? [0, 1, 2, 3].map((slot) => (
                <li key={slot}>
                  <div className="flex flex-col items-center rounded-2xl bg-white px-3 py-6 shadow-sm ring-1 ring-slate-200">
                    <span className="h-28 w-28 rounded-full border border-dashed border-slate-300" />
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
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
              onClick={() => setSelected(null)}
            >
              <section
                className="relative w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-5 text-center text-slate-900 shadow-2xl ring-1 ring-slate-200"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 text-left">
                  <h2 id="team-member-title" className="text-xl font-semibold text-[#0E1548]">{selected.name}</h2>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-slate-50"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-left text-sm text-slate-400">{selected.handle}</p>
                <Portrait member={selected} className="mx-auto mt-6 h-40 w-40 rounded-full" />
                <p className="mt-6 text-sm leading-relaxed text-slate-600">{selected.about}</p>
                {selected.role ? <p className="mt-3 text-xs font-medium text-[#2D6AF6]">{selected.role}</p> : null}
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
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
              onClick={() => setApplyOpen(false)}
            >
              <section
                className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-slate-200"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="team-apply-title" className="text-lg font-semibold text-[#0E1548]">{opening.title}</h2>
                {opening.description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{opening.description}</p> : null}
                <label htmlFor="apply-note" className="mt-4 block text-sm text-slate-500">Kısa not</label>
                <textarea
                  id="apply-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                {applyError ? <p className="mt-2 text-sm text-red-700">{applyError}</p> : null}
                <button type="button" onClick={() => void submitApplication()} className="mt-4 w-full rounded-xl bg-[#0E1548] px-3 py-2.5 text-sm font-semibold text-white">
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
