import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const month = new URL(request.url).searchParams.get('month');
    const admin = createAdminClient();

    if (month) {
      const { data, error } = await admin.rpc('get_personnel_month_stats', {
        p_employee_id: session.employeeId,
        p_month: month,
      });

      if (error) {
        if (error.message.includes('get_personnel_month_stats')) {
          return NextResponse.json(
            { error: '011_personnel_month_stats.sql çalıştırın', code: 'MIGRATION_REQUIRED' },
            { status: 503 }
          );
        }
        return NextResponse.json({ error: 'Özet yüklenemedi' }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
      }

      return NextResponse.json({ stats: data });
    }

    const { data, error } = await admin.rpc('get_personnel_dashboard', {
      p_employee_id: session.employeeId,
    });

    if (error) {
      if (error.message.includes('get_personnel_dashboard')) {
        return NextResponse.json(
          { error: '005_personnel_panel.sql çalıştırın', code: 'MIGRATION_REQUIRED' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'Özet yüklenemedi' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
