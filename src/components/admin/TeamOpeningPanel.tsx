'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import { cardClass } from '@/components/ui/styles';

type Opening = { id: string; title: string; description: string | null; is_open: boolean };
type Application = { id: string; note: string | null; status: string; created_at: string };

function supabaseOrNull() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return createClient();
}

export function TeamOpeningPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = supabaseOrNull();
    if (!supabase) return;
    const { data } = await supabase
      .from('team_openings')
      .select('id, title, description, is_open')
      .order('created_at', { ascending: false });
    const rows = (data ?? []) as Opening[];
    setOpenings(rows);
    const current = rows.find((item) => item.is_open);
    if (!current) {
      setApplications([]);
      return;
    }
    const { data: apps } = await supabase
      .from('team_applications')
      .select('id, note, status, created_at')
      .eq('opening_id', current.id)
      .order('created_at', { ascending: false });
    setApplications((apps ?? []) as Application[]);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = supabaseOrNull();
    if (!supabase) {
      setError('Supabase bağlı değil.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('team_openings').insert({
      title: title.trim(),
      description: description.trim() || null,
      is_open: true,
      created_by: user?.id ?? null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle('');
    setDescription('');
    setMessage('Ekip ilanı açıldı. Giriş yapmış kullanıcılar başvurabilir.');
    await refresh();
  }

  async function closeOpening(id: string) {
    const supabase = supabaseOrNull();
    if (!supabase) return;
    await supabase.from('team_openings').update({ is_open: false }).eq('id', id);
    await refresh();
  }

  const current = openings.find((item) => item.is_open);

  return (
    <div className={`${cardClass} p-6`}>
      <h2 className="text-lg font-bold text-[#0E1548]">Ekip ilanı</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        İlan açıkken giriş yapmış kullanıcılar ekip sayfasından başvurur.
      </p>
      <form onSubmit={onCreate} className="mt-4 space-y-3">
        <div>
          <label htmlFor="opening-title" className={labelClass}>Başlık</label>
          <input id="opening-title" required className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="opening-description" className={labelClass}>Açıklama</label>
          <textarea id="opening-description" className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
        <button type="submit" className={primaryButtonClass}>İlanı aç</button>
      </form>
      {current ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-[#0E1548]">{current.title}</p>
          <p className="mt-1 text-slate-600">{applications.length} başvuru</p>
          <button type="button" className="mt-2 text-sm font-medium text-[#2D6AF6]" onClick={() => closeOpening(current.id)}>
            İlanı kapat
          </button>
        </div>
      ) : null}
    </div>
  );
}
