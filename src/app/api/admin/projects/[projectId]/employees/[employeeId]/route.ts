import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { queryEmployeeById } from '@/lib/employee-db';
import { withSignedEmployeePhoto } from '@/lib/photo-storage';
import { formatFullName } from '@/lib/format';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type Ctx = { params: Promise<{ projectId: string; employeeId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;
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
    await requireAdminUser();
    const { projectId, employeeId } = await ctx.params;
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

    if (email !== undefined) {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return NextResponse.json({ error: 'Geçerli bir e-posta girin' }, { status: 400 });
      }
      updates.email = normalized;
    }
    if (phone !== undefined) updates.phone = phone || null;
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
