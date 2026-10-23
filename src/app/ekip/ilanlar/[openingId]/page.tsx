'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiArrowUpRight, FiCalendar, FiCheck, FiClock, FiFileText, FiShield, FiUser } from 'react-icons/fi';
import { HomeHeader } from '@/components/home/HomeHeader';
import { createClient } from '@/utils/supabase/client';

type Opening = { id: string; title: string; description: string | null };
type Profile = { fullName: string | null; email: string | null; studentNo: string | null; department: string | null; classYear: string | null; phone: string | null };
const DEMO_OPENINGS: Opening[] = [
  {
    id: 'opening_demo_active',
    title: '2026 Gönüllü Ekip',
    description: 'Etkinlik günlerinde check-in, karşılama ve saha desteği için gönüllü ekip arkadaşları arıyoruz.',
  },
  {
    id: 'opening_demo_social',
    title: 'Sosyal Medya ve İletişim Ekibi',
    description: 'Etkinlik duyuruları, sosyal medya içerikleri ve katılımcı iletişimi için yaratıcı ekip arkadaşları arıyoruz.',
  },
];
const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const CUSTOM_TIME_SLOT = 'Farklı bir saat aralığı';
const TIME_SLOTS = ['09:00 – 12:00', '12:00 – 15:00', '15:00 – 18:00', '18:00 sonrası', 'Her saat', CUSTOM_TIME_SLOT];
const SKILL_OPTIONS = ['İletişim', 'Organizasyon', 'Sosyal medya', 'Fotoğraf / video', 'Tasarım', 'Teknik destek', 'Yabancı dil'];

export default function TeamApplicationPage() {
  const params = useParams<{ openingId: string }>();
  const router = useRouter();
  const [opening, setOpening] = useState<Opening | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [skills, setSkills] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [customTimeSlot, setCustomTimeSlot] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availabilityType, setAvailabilityType] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? createClient()
          : null;
      if (supabase) {
        const { data } = await supabase.from('team_openings').select('id, title, description').eq('id', params.openingId).eq('is_open', true).maybeSingle();
        setOpening(data ?? DEMO_OPENINGS.find((item) => item.id === params.openingId) ?? null);
      } else {
        setOpening(DEMO_OPENINGS.find((item) => item.id === params.openingId) ?? null);
      }
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const payload = (await profileResponse.json()) as { profile?: Profile };
        setProfile(payload.profile ?? null);
      }
    })();
  }, [params.openingId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!profile) {
      router.push('/login');
      return;
    }
    if (!consent) {
      setError('Başvuruyu göndermek için bilgilendirmeyi onaylamalısın.');
      return;
    }
    setSubmitting(true);
    const supabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? createClient()
        : null;
    if (!supabase || !opening) {
      setMessage('Demo ilanı: form bilgilerin örnek modda alındı.');
      setSubmitting(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const availabilitySummary = [
      availabilityType ? `Tercih: ${availabilityType}` : '',
      selectedDays.length ? `Günler: ${selectedDays.join(', ')}` : '',
      selectedTimeSlots.length ? `Saatler: ${selectedTimeSlots.join(', ')}` : '',
      customTimeSlot.trim() ? `Özel saat: ${customTimeSlot.trim()}` : '',
      availability.trim() ? `Not: ${availability.trim()}` : '',
    ].filter(Boolean).join(' | ');
    const skillsSummary = [...selectedSkills, skills.trim() ? `Diğer: ${skills.trim()}` : ''].filter(Boolean).join(', ');
    const { error: insertError } = await supabase.from('team_applications').insert({
      opening_id: opening.id,
      profile_id: user.id,
      motivation: motivation.trim(),
      experience: experience.trim() || null,
      availability: availabilitySummary || null,
      skills: skillsSummary || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setMessage('Başvurun alındı. Ekip başvurularını değerlendirip sana dönüş yapacağız.');
  }

  function growTextarea(event: React.FormEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    const beforeBottom = textarea.getBoundingClientRect().bottom;
    const viewportBottom = window.innerHeight - 24;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    requestAnimationFrame(() => {
      const bounds = textarea.getBoundingClientRect();
      if (beforeBottom > viewportBottom) {
        window.scrollBy({ top: bounds.bottom - beforeBottom, behavior: 'auto' });
      } else if (bounds.bottom > viewportBottom) {
        window.scrollBy({ top: bounds.bottom - viewportBottom, behavior: 'smooth' });
      }
    });
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#e7f3fb] via-[#f5fbff] to-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+1.5rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <main className="mx-auto w-full max-w-6xl">
        <Link href="/ekip/ilanlar" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2D6AF6] transition hover:text-[#0E1548]">
          <FiArrowLeft className="h-4 w-4" aria-hidden /> İlanlara dön
        </Link>
        {!opening ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-[#0E1548]">İlan bulunamadı</h1>
            <p className="mt-2 text-sm text-slate-600">Bu ilan kapanmış veya artık mevcut değil.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="hidden self-start lg:sticky lg:top-24 lg:block">
              <div className="rounded-[2rem] border border-[#d9e5ff] bg-gradient-to-br from-[#edf4ff] via-white to-white p-6 shadow-[0_18px_50px_rgba(45,106,246,0.08)] sm:p-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e3ff] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2D6AF6]">
                  <FiFileText className="h-3.5 w-3.5" aria-hidden /> İlan detayı
                </span>
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#0E1548] sm:text-[1.7rem]">{opening.title}</h1>
                <p className="mt-4 text-[15px] leading-7 text-slate-600">{opening.description}</p>
                <div className="mt-7 grid gap-3 border-t border-blue-100 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D6AF6] shadow-sm">
                      <FiClock className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0E1548]">Başvurular açık</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">Başvurular ekip tarafından değerlendiriliyor.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <FiCheck className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0E1548]">Şeffaf değerlendirme</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">Uygun görülmesi halinde seninle iletişime geçeceğiz.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2D6AF6]">Gönüllü başvurusu</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0E1548]">Kendini ve uygunluğunu anlat</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Profilindeki bilgiler otomatik dolduruldu. Başvurunu tamamlamak için aşağıdaki alanları yanıtlaman yeterli.</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-bold text-[#2D6AF6] sm:inline-flex">1 / 1</span>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#2D6AF6] shadow-sm">
                    <FiUser className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0E1548]">Profil özeti</p>
                    <p className="text-xs text-slate-500">Başvurunda kullanılacak hesap bilgilerin</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-x-5 gap-y-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ad soyad</p><p className="mt-1 font-medium text-slate-700">{profile?.fullName ?? 'Yükleniyor…'}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">E-posta</p><p className="mt-1 break-words font-medium text-slate-700">{profile?.email ?? '—'}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Öğrenci no</p><p className="mt-1 font-medium text-slate-700">{profile?.studentNo ?? '—'}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bölüm / sınıf</p><p className="mt-1 font-medium text-slate-700">{[profile?.department, profile?.classYear].filter(Boolean).join(' · ') || '—'}</p></div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-[#f7faff] p-4 lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D6AF6] shadow-sm">
                      <FiFileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0E1548]">{opening.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Başvuruya özel bilgiler</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Açık</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-blue-100 pt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><FiClock className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> Esnek değerlendirme</span>
                  <span className="inline-flex items-center gap-1.5"><FiCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> Ekip geri dönüşü</span>
                </div>
              </div>
              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-sm font-bold text-[#0E1548]">Başvuru detayların</p>
                <p className="mt-1 text-xs text-slate-500">Seni ve ekibe katabileceğin değeri daha iyi tanımamıza yardımcı ol.</p>
              </div>
              <label className="mt-5 block text-sm font-semibold text-[#0E1548]">Neden bu ilana başvuruyorsun? <span className="text-red-500">*</span>
                <textarea required minLength={30} rows={5} value={motivation} onInput={growTextarea} onChange={(e) => setMotivation(e.target.value)} placeholder="Motivasyonunu, beklentilerini ve ekibe katmak istediğin değeri anlat." className="mt-2 min-h-[140px] w-full max-w-full resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="mt-5 block text-sm font-semibold text-[#0E1548]">Deneyimlerin
                <textarea rows={4} value={experience} onInput={growTextarea} onChange={(e) => setExperience(e.target.value)} placeholder="Daha önce yaptığın gönüllülük, organizasyon veya ekip çalışmalarını paylaş." className="mt-2 min-h-[112px] w-full max-w-full resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              <fieldset className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <legend className="px-1 text-sm font-bold text-[#0E1548]">Uygunluk durumun</legend>
                <p className="mt-1 text-xs leading-5 text-slate-500">Birden fazla seçenek işaretleyebilirsin.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {['Hafta içi', 'Hafta sonu', 'Her iki dönem'].map((option) => (
                    <button type="button" key={option} onClick={() => setAvailabilityType(availabilityType === option ? '' : option)} className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${availabilityType === option ? 'border-[#2D6AF6] bg-[#edf4ff] text-[#0E1548] ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-white'}`}>
                      <span className={`mr-2 inline-block h-2 w-2 rounded-full ${availabilityType === option ? 'bg-[#2D6AF6]' : 'bg-slate-300'}`} />{option}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2D6AF6]"><FiCalendar className="h-4 w-4" aria-hidden /> Müsait olduğun günler</div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEKDAYS.map((day) => {
                    const selected = selectedDays.includes(day);
                    return <button type="button" key={day} onClick={() => setSelectedDays((current) => selected ? current.filter((item) => item !== day) : [...current, day])} className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${selected ? 'border-[#2D6AF6] bg-[#edf4ff] text-[#0E1548]' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`} aria-pressed={selected}>{day}</button>;
                  })}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2D6AF6]"><FiClock className="h-4 w-4" aria-hidden /> Uygun olduğun saat aralıkları</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TIME_SLOTS.map((slot) => {
                    const selected = selectedTimeSlots.includes(slot);
                    return <button type="button" key={slot} onClick={() => setSelectedTimeSlots((current) => {
                      if (selected) return current.filter((item) => item !== slot);
                      if (slot === 'Her saat' || slot === CUSTOM_TIME_SLOT) return [slot];
                      return current.filter((item) => item !== 'Her saat' && item !== CUSTOM_TIME_SLOT).concat(slot);
                    })} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${selected ? 'border-[#2D6AF6] bg-[#edf4ff] text-[#0E1548] ring-2 ring-blue-100' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`} aria-pressed={selected}>{selected && slot === CUSTOM_TIME_SLOT ? '✓ ' : ''}{slot}</button>;
                  })}
                </div>
                {selectedTimeSlots.includes(CUSTOM_TIME_SLOT) ? (
                  <label className="mt-4 block text-xs font-semibold text-slate-600">Saat aralığını belirt
                    <input value={customTimeSlot} onChange={(e) => setCustomTimeSlot(e.target.value)} placeholder="Örn. Salı 19:00 – 21:00 veya etkinlik öncesi" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                  </label>
                ) : null}
                <label className="mt-4 block text-xs font-semibold text-slate-600">Ek uygunluk notu
                  <input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Örn. Sınav haftalarında uygunluğum değişebilir." className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
              </fieldset>
              <fieldset className="mt-5 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <legend className="px-1 text-sm font-bold text-[#0E1548]">Becerilerin</legend>
                <p className="mt-1 text-xs leading-5 text-slate-500">Ekibe katkı sağlayabileceğin alanları seç.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const selected = selectedSkills.includes(skill);
                    return <button type="button" key={skill} onClick={() => setSelectedSkills((current) => selected ? current.filter((item) => item !== skill) : [...current, skill])} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? 'border-[#2D6AF6] bg-[#edf4ff] text-[#0E1548]' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'}`} aria-pressed={selected}>{selected ? '✓ ' : ''}{skill}</button>;
                  })}
                </div>
                <label className="mt-4 block text-xs font-semibold text-slate-600">Diğer becerilerin
                  <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Listede olmayan becerilerini yazabilirsin." className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal outline-none transition focus:border-[#2D6AF6] focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
              </fieldset>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-[#f7faff] p-3.5 text-xs leading-5 text-slate-600 transition hover:border-blue-200 hover:bg-[#f3f7ff]">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#2D6AF6]" />
                <span className="flex items-start gap-2">
                  <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6AF6]" aria-hidden />
                  <span>Başvurumu değerlendirmek için paylaştığım bilgilerin kullanılmasını kabul ediyorum.</span>
                </span>
              </label>
              {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
              <button type="submit" disabled={submitting || Boolean(message)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E1548] text-sm font-bold text-white shadow-md transition hover:bg-[#152060] disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Başvuru gönderiliyor…' : 'Gönüllü başvurusunu gönder'} <FiArrowUpRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
