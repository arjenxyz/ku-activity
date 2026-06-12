import { NextResponse } from 'next/server';
import { requireAdminProjectAccess } from '@/lib/admin-auth';
import { queryEmployeeById } from '@/lib/employee-db';
import { withSignedEmployeePhoto } from '@/lib/photo-storage';
import { formatFullName } from '@/lib/format';
import {
  assertEmployeeContactUnique,
  mapIdentityUniqueViolation,
} from '@/lib/identity-uniqueness';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const supabase = await createClient();
    const { data, error } = await queryEmployeeById(supabase, employeeId);

    if (error) return NextResponse.json({ error }, { status: 500 });
    if (!data || data.project_id !== projectId) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const employee = await withSignedEmployeePhoto(data);
    return NextResponse.json({ employee });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { projectId, employeeId } = await ctx.params;
    await requireAdminProjectAccess(projectId);
    const body = await request.json();
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      position,
      dailyWage,
      hireDate,
      isActive,
    } = body as {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      position?: string;
      dailyWage?: number;
      hireDate?: string | null;
      isActive?: boolean;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (firstName !== undefined || lastName !== undefined) {
      updates.name = formatFullName(firstName ?? '', lastName ?? '');
      if (!updates.name) {
        return NextResponse.json({ error: 'Ad ve soyad zorunludur' }, { status: 400 });
      }
    } else if (name !== undefined) {
      updates.name = name.trim();
    }

    if (email !== undefined || phone !== undefined) {
      const admin = createAdminClient();
      try {
        const contactUpdates = await assertEmployeeContactUnique(admin, {
          email,
          phone,
          excludeEmployeeId: employeeId,
        });
        if (contactUpdates.email !== undefined) {
          updates.email = contactUpdates.email;
        }
        if (phone !== undefined) {
          updates.phone = phone || null;
          updates.phone_lookup_hash = contactUpdates.phoneLookupHash ?? null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
        return NextResponse.json({ error: message }, { status: 409 });
      }
    }
    if (position !== undefined) updates.position = position;
    if (dailyWage !== undefined) updates.daily_wage = dailyWage;
    if (hireDate !== undefined) updates.hire_date = hireDate || null;
    if (isActive !== undefined) updates.is_active = isActive;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .eq('project_id', projectId);

    if (error) {
      const mapped = mapIdentityUniqueViolation(error.message ?? '');
      return NextResponse.json(
        { error: mapped ?? error.message },
        { status: mapped ? 409 : 500 }
      );
    }

    const { data, error: readError } = await queryEmployeeById(supabase, employeeId);
    if (readError || !data) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ employee: data });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
