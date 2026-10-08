'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
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
        .select('id, status')
        .eq('opening_id', current.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      setApplied(Boolean(mine));
      setApplyStatus(mine?.status ?? null);
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
    setApplyStatus('pending');
    setApplyDone(true);
    setApplyOpen(false);
  }

  const applyStatusLabel =
    applyStatus === 'accepted'
      ? 'Kabul edildi'
      : applyStatus === 'rejected'
        ? 'Reddedildi'
        : applyStatus === 'pending'
          ? 'Bekliyor'
          : 'Başvurdun';

  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Ekip</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          Kayıt onayı ve şifre sıfırlama için görüşeceğin ekip.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TEAM_MEMBERS.map((member) => (
            <li key={member.handle}>
              <button
                type="button"
                onClick={() => setSelected(member)}
                className="flex w-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-5 text-center transition hover:border-[#2D6AF6]/30 hover:bg-[#e8f0ff]"
              >
                <Portrait member={member} className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
                <span className="mt-3 text-sm text-slate-700">{member.name}</span>
              </button>
            </li>
          ))}
          <li>
            {applied ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-3 py-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-500">✓</span>
                <span className="mt-4 text-sm text-slate-600">{applyStatusLabel}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!opening) return;
                  if (!userId) {
                    window.location.href = '/login';
                    return;
                  }
                  setApplyOpen(true);
                }}
                className="flex h-full min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-3 py-5 text-center transition hover:border-[#2D6AF6]/40 hover:bg-[#e8f0ff]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 text-2xl font-light text-slate-500">+</span>
                <span className="mt-4 text-sm text-slate-600">Apply</span>
              </button>
            )}
          </li>
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
