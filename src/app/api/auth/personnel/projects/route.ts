import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_login_projects');
  if (error) {
    console.error('Proje listesi hatası:', error);
    return NextResponse.json({ error: 'Projeler yüklenemedi' }, { status: 500 });
  }
  return NextResponse.json({ projects: data ?? [] });
}
