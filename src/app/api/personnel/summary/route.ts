import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import strings from '@json/src/app/api/personnel/summary/route.json';

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
            { error: strings.err011PersonnelMonthStatsSqlÇalıştırın, code: 'MIGRATION_REQUIRED' },
            { status: 503 }
          );
        }
        return NextResponse.json({ error: strings.özetYüklenemedi }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
      }

      return NextResponse.json({ stats: data });
    }

    const { data, error } = await admin.rpc('get_personnel_dashboard', {
      p_employee_id: session.employeeId,
    });

    if (error) {
      if (error.message.includes('get_personnel_dashboard')) {
        return NextResponse.json(
          { error: strings.err005PersonnelPanelSqlÇalıştırın, code: 'MIGRATION_REQUIRED' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: strings.özetYüklenemedi }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: strings.oturumGeçersiz }, { status: 401 });
  }
}
