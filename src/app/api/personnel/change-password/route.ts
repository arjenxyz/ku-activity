import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Mevcut ve yeni şifre gerekli' }, { status: 400 });
    }
    if (newPassword.length < 4 || newPassword.length > 12) {
      return NextResponse.json({ error: 'Yeni şifre 4-12 karakter olmalı' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: employee, error } = await admin
      .from('employees')
      .select('pin_hash')
      .eq('id', session.employeeId)
      .single();

    if (error || !employee?.pin_hash) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, employee.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 401 });
    }

    const pinHash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await admin
      .from('employees')
      .update({ pin_hash: pinHash })
      .eq('id', session.employeeId);

    if (updateError) {
      return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
