import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import strings from '@json/src/app/api/auth/personnel/employees/route.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: strings.projectidGerekli }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_login_employees', {
    p_project_id: projectId,
  });

  if (error) {
    console.error('Personel listesi hatası:', error);
    return NextResponse.json({ error: strings.personelListesiYüklenemedi }, { status: 500 });
  }

  return NextResponse.json({ employees: data ?? [] });
}
