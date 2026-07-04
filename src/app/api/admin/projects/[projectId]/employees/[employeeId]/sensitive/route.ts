import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { decryptField, maskIban, maskTcKimlik } from '@/lib/field-encryption';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/projects/[projectId]/employees/[employeeId]/sensitive/route.json';

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const admin = createAdminClient();

    const { data: emp } = await admin
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (!emp) {
      return NextResponse.json({ error: strings.personelBulunamadı }, { status: 404 });
    }

    const { data, error } = await admin
      .from('employee_sensitive_data')
      .select('tc_kimlik_enc, birth_date_enc, iban_enc')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (error) {
      if (error.message.includes('employee_sensitive_data')) {
        return NextResponse.json(
          { error: strings.err014PersonnelRegistrationSqlÇalıştırın },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ sensitive: null });
    }

    if (!process.env.FIELD_ENCRYPTION_KEY) {
      return NextResponse.json({ error: strings.fieldEncryptionKeyEksik }, { status: 503 });
    }

    const tc = decryptField(data.tc_kimlik_enc);
    const birthDate = decryptField(data.birth_date_enc);
    const iban = decryptField(data.iban_enc);

    return NextResponse.json({
      sensitive: {
        tcKimlik: tc,
        tcKimlikMasked: maskTcKimlik(tc),
        birthDate,
        iban,
        ibanMasked: maskIban(iban),
      },
    });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
