import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import strings from '@json/src/app/api/personnel/minimum-wages/route.json';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const month = new URL(request.url).searchParams.get('month');
    const admin = createAdminClient();

    let q = admin
      .from('minimum_wages')
      .select('id, date, amount, description, created_at')
      .eq('employee_id', session.employeeId)
      .order('date', { ascending: false })
      .limit(200);

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      q = q.gte('date', start).lte('date', end);
    }

    const { data, error } = await q;

    if (error) {
      if (error.message.includes('minimum_wages')) {
        return NextResponse.json({ records: [], note: '004_menu_features.sql çalıştırın' });
      }
      return NextResponse.json({ error: strings.kayıtlarYüklenemedi }, { status: 500 });
    }

    return NextResponse.json({ records: data ?? [] });
  } catch {
    return NextResponse.json({ error: strings.oturumGeçersiz }, { status: 401 });
  }
}
