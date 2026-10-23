'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiArrowUpRight, FiChevronRight, FiPlus, FiUsers, FiX } from 'react-icons/fi';
import { HomeHeader } from '@/components/home/HomeHeader';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { memberInitials, type TeamMember } from '@/lib/team';
import { createClient } from '@/utils/supabase/client';

type RosterMember = TeamMember & { id?: string };
type TeamOpening = { id: string; title: string; description: string | null };
type Profile = {
  fullName: string | null;
  email: string | null;
  studentNo: string | null;
  department: string | null;
  classYear: string | null;
  phone: string | null;
};

function Portrait({ member, className }: { member: RosterMember; className: string }) {
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
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [membersReady, setMembersReady] = useState(false);
  const [selected, setSelected] = useState<RosterMember | null>(null);
  const [mounted, setMounted] = useState(false);
  const [openings, setOpenings] = useState<TeamOpening[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<TeamOpening | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appliedOpeningIds, setAppliedOpeningIds] = useState<string[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [siteSession, setSiteSession] = useState<boolean | null>(null);
  const [demoSession, setDemoSession] = useState(false);
  const [note, setNote] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyDone, setApplyDone] = useState(false);

  useBodyScrollLock(selected !== null || applyOpen || selectedOpening !== null);
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
    void (async () => {
      try {
        const response = await fetch('/api/team/members');
        const payload = (await response.json().catch(() => null)) as {
          members?: RosterMember[];
        } | null;
        setMembers(payload?.members ?? []);
      } catch {
        setMembers([]);
      } finally {
        setMembersReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) return;
    void (async () => {
      const { data: openingRows } = await supabase
        .from('team_openings')
        .select('id, title, description, is_open')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      setOpenings(openingRows ?? []);
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user || !openingRows?.length) return;
      const { data: mine } = await supabase
        .from('team_applications')
        .select('opening_id')
        .eq('profile_id', user.id)
        .in('opening_id', openingRows.map((row) => row.id));
      setAppliedOpeningIds((mine ?? []).map((row) => row.opening_id as string));
    })();
  }, [applyDone]);

  useEffect(() => {
    void fetch('/api/session')
      .then((response) => response.json() as Promise<{ session?: { demo?: boolean } | null }>)
      .then((payload) => {
        setSiteSession(Boolean(payload.session));
        setDemoSession(Boolean(payload.session?.demo));
        if (payload.session?.demo) {
          setOpenings([
            {
              id: 'opening_demo_active',
              title: '2026 Gönüllü Ekip',
              description:
                'Etkinlik günlerinde check-in, karşılama ve saha desteği için gönüllü ekip arkadaşları arıyoruz. Haftada en az bir vardiya katkı sunabilirsin.',
            },
            {
              id: 'opening_demo_social',
              title: 'Sosyal Medya ve İletişim Ekibi',
              description:
                'Etkinlik duyuruları, sosyal medya içerikleri ve katılımcı iletişimi için yaratıcı ekip arkadaşları arıyoruz.',
            },
          ]);
        }
      })
      .catch(() => setSiteSession(false));
  }, []);

  useEffect(() => {
    if (!siteSession) return;
    void fetch('/api/profile')
      .then((response) => response.json() as Promise<{ profile?: Profile }>)
      .then((payload) => setProfile(payload.profile ?? null))
      .catch(() => setProfile(null));
  }, [siteSession]);

  async function submitApplication() {
    if (demoSession) {
      setApplyError('Demo ilanında başvuru gönderimi örnek modda kapalıdır.');
      return;
    }
    if (!selectedOpening || !userId) {
      setApplyError('Başvuru göndermek için hesabınızla yeniden giriş yapın.');
      return;
    }
    setApplyError(null);
    const supabase = browserSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('team_applications').insert({
      opening_id: selectedOpening.id,
      profile_id: userId,
      note: note.trim() || null,
    });
    if (error) {
      setApplyError(error.message);
      return;
    }
    setAppliedOpeningIds((current) => [...current, selectedOpening.id]);
    setApplyDone(true);
    setSelectedOpening(null);
    setApplyOpen(false);
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#e7f3fb] via-[#f5fbff] to-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+1.5rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-6xl">
          <div className="px-1 py-5 sm:px-2 sm:py-8">
            <div>
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f0ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">
                  <FiUsers className="h-3.5 w-3.5" aria-hidden />
                  Destek ekibi
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0E1548] sm:text-4xl">
                  Ekip üyeleriyle tanış
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Kayıt, etkinlik ve hesap işlemlerinde sana yardımcı olacak ekip arkadaşlarımız.
                  Bir üyeye dokunarak görevini ve iletişim bilgisini görebilirsin.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 px-1 py-2 sm:mt-10 sm:px-2">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0E1548]">Sana yardımcı olmak için buradayız</h2>
                <p className="mt-1 text-xs text-slate-500">Detayları görmek için bir ekip kartı seç.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {members.length} üye
              </span>
            </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {!membersReady ? (
            <li className="col-span-2 py-8 text-center text-sm text-slate-500 sm:col-span-3 lg:col-span-4">
              Yükleniyor…
            </li>
          ) : null}
          {members.map((member) => (
            <li key={member.id ?? member.handle}>
              <button
                type="button"
                onClick={() => setSelected(member)}
                className="group flex w-full flex-col items-center rounded-3xl border border-slate-200 bg-white px-3 py-5 text-center shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-1 hover:border-[#2D6AF6]/30 hover:shadow-lg hover:shadow-blue-900/[0.08]"
              >
                <Portrait member={member} className="h-24 w-24 rounded-[1.5rem] ring-4 ring-[#e8f0ff] transition group-hover:ring-blue-100 sm:h-28 sm:w-28" />
                <span className="mt-4 text-sm font-bold text-[#0E1548]">{member.name}</span>
                <span className="mt-1 text-xs text-slate-500">{member.role || 'Ekip üyesi'}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D6AF6]">
                  Profili gör <FiArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link
            href="/ekip/ilanlar"
            className="group mt-6 flex w-full items-center justify-between gap-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#e8f0ff] via-white to-[#effcf7] px-5 py-4 text-left shadow-sm shadow-blue-900/[0.04] transition hover:border-[#2D6AF6]/40 hover:shadow-md hover:shadow-blue-900/[0.08] sm:px-6 sm:py-5"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D6AF6] shadow-sm ring-1 ring-blue-100 transition group-hover:bg-[#2D6AF6] group-hover:text-white">
                <FiPlus className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#0E1548] sm:text-base">
                  Ekibimize katılmak ister misin?
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500 sm:text-sm">
                  {openings.length
                    ? `${openings.length} aktif ekip ilanı mevcut. Sana uygun olanı seçmek için tıkla.`
                    : 'Yeni ekip fırsatları açıldığında burada görebilirsin.'}
                </span>
              </span>
            </span>
            <FiArrowUpRight className="h-5 w-5 shrink-0 text-[#2D6AF6] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </Link>
          </div>
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
                className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl ring-1 ring-slate-200"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 pb-4 pt-3">
                  <div className="mb-3 flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">Ekip profili</p>
                      <h2 id="team-member-title" className="mt-1 text-xl font-bold text-[#0E1548]">{selected.name}</h2>
                    </div>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-slate-50"
                  >
                    <FiX className="h-5 w-5" aria-hidden />
                  </button>
                  </div>
                </div>
                <div className="px-6 pb-8 pt-6 text-center">
                  <p className="text-left text-xs text-slate-400">{selected.handle}</p>
                  <Portrait member={selected} className="mx-auto mt-5 h-32 w-32 rounded-[2rem] ring-4 ring-[#e8f0ff]" />
                  {selected.role ? <p className="mt-5 inline-flex rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#2D6AF6]">{selected.role}</p> : null}
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{selected.about}</p>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
      {mounted && applyOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-apply-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md"
              onClick={() => setApplyOpen(false)}
            >
              <section
                className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl ring-1 ring-slate-200"
                data-scroll-lock-allow=""
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 pb-4 pt-3">
                  <div className="mb-3 flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">
                        {selectedOpening ? 'Ekip başvurusu' : 'Açık ekip ilanları'}
                      </p>
                      <h2 id="team-apply-title" className="mt-1 text-lg font-bold text-[#0E1548]">
                        {selectedOpening ? selectedOpening.title : 'Sana uygun ilanı seç'}
                      </h2>
                    </div>
                    <button type="button" aria-label="Kapat" onClick={() => setApplyOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#0E1548] hover:bg-white">
                      <FiX className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {selectedOpening ? (
                    <>
                      {selectedOpening.description ? <p className="text-sm leading-relaxed text-slate-600">{selectedOpening.description}</p> : null}
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-[#f5f9ff] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2D6AF6]">Bilgilerin</p>
                        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <p><span className="font-semibold text-[#0E1548]">Ad soyad:</span> {profile?.fullName ?? 'Profil bilgisi yok'}</p>
                          <p><span className="font-semibold text-[#0E1548]">E-posta:</span> {profile?.email ?? '—'}</p>
                          <p><span className="font-semibold text-[#0E1548]">Öğrenci no:</span> {profile?.studentNo ?? '—'}</p>
                          <p><span className="font-semibold text-[#0E1548]">Bölüm:</span> {profile?.department ?? '—'}</p>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Bu bilgiler hesabından otomatik alınır.</p>
                      </div>
                      <label htmlFor="apply-note" className="mt-5 block text-sm font-medium text-slate-600">Kendini tanıt</label>
                      <textarea
                        id="apply-note"
                        rows={5}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Bu ilana neden başvurduğunu, hangi deneyimlerin olduğunu ve ekibe nasıl katkı sunabileceğini anlat."
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                      {applyError ? <p className="mt-2 text-sm text-red-700">{applyError}</p> : null}
                      <button type="button" onClick={() => void submitApplication()} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] px-3 text-sm font-semibold text-white shadow-md shadow-[#0E1548]/15 transition hover:bg-[#152060]">
                        Başvur <FiArrowUpRight className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : openings.length ? (
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed text-slate-600">
                        İlana tıklayarak detaylarını incele, ardından kendini tanıtarak başvurunu tamamla.
                      </p>
                      {openings.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedOpening(item)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#2D6AF6]/40 hover:bg-[#e8f0ff]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#0E1548]">{item.title}</span>
                            <span className="mt-1 block truncate text-xs text-slate-500">{item.description}</span>
                          </span>
                          <FiChevronRight className="h-5 w-5 shrink-0 text-[#2D6AF6]" aria-hidden />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-blue-100 bg-[#f5f9ff] px-4 py-4">
                      <p className="text-sm font-semibold text-[#0E1548]">Şu anda açık bir ekip ilanı yok.</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        Yeni ekip fırsatları yayınlandığında bu alandan başvurabilirsin.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
