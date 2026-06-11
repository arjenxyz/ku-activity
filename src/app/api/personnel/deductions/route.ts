import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const month = new URL(request.url).searchParams.get('month');
    const admin = createAdminClient();

    let q = admin
      .from('deductions')
      .select('id, date, type, amount, description')
      .eq('employee_id', session.employeeId)
      .order('date', { ascending: false })
      .limit(366);

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      q = q.gte('date', `${month}-01`).lte('date', end);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ error: 'Kayıtlar yüklenemedi' }, { status: 500 });
    }

    return NextResponse.json({ deductions: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
