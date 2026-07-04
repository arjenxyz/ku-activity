import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { decryptEmployeePinForAdmin } from '@/lib/personnel-pin-storage';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/employees/pins/route.json';

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    await requireAdminProjectAccess(projectId);

    if (!process.env.FIELD_ENCRYPTION_KEY) {
      return NextResponse.json({ error: strings.fieldEncryptionKeyEksik }, { status: 503 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('employees')
      .select('id, name, is_active, pin_hash, pin_encrypted')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) {
      if (error.message.includes('pin_encrypted')) {
        return NextResponse.json(
          { error: strings.err040EmployeePinEncryptedSqlMigration },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const employees = (data ?? []).map((row) => {
      const pin = decryptEmployeePinForAdmin(row.pin_encrypted as string | null);
      return {
        id: row.id as string,
        name: row.name as string,
        isActive: row.is_active as boolean,
        hasPin: Boolean(row.pin_hash),
        pin,
        pinVisible: pin != null,
      };
    });

    return NextResponse.json({ employees });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
