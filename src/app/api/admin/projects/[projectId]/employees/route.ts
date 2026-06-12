import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { queryProjectEmployees } from '@/lib/employee-db';
import { withSignedEmployeePhotos } from '@/lib/photo-storage';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId } = await ctx.params;
    const supabase = await createClient();
    const { data, error } = await queryProjectEmployees(supabase, projectId);

    if (error) {
      return NextResponse.json(
        {
          error: error.includes('does not exist')
            ? 'Veritabanı güncel değil: supabase/migrations/013_schema_repair.sql çalıştırın'
            : error,
        },
        { status: 500 }
      );
    }

    const employees = await withSignedEmployeePhotos(data ?? []);
    return NextResponse.json({ employees });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
