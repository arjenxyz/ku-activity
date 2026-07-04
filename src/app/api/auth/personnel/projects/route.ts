import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import strings from '@json/src/app/api/auth/personnel/projects/route.json';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_login_projects');
  if (error) {
    console.error('Proje listesi hatası:', error);
    return NextResponse.json({ error: strings.projelerYüklenemedi }, { status: 500 });
  }
  return NextResponse.json({ projects: data ?? [] });
}
