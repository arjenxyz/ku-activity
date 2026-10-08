import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import {
  cancelRegistration,
  getRegistration,
  ownerKeyForRole,
} from '@/lib/demo/registrations-store';
import { presentRegistration } from '@/lib/registrations/present';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSiteSession();
  if (!session || (session.role !== 'student' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }
  const { id } = await params;
  const row = getRegistration(id);
  const ownerKey = ownerKeyForRole(session.role === 'admin' ? 'student' : 'student');
  if (!row || (row.ownerKey !== ownerKey && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ registration: presentRegistration(row) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSiteSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Öğrenci oturumu gerekli' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const row = cancelRegistration(id, ownerKeyForRole('student'));
    return NextResponse.json({ registration: presentRegistration(row) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'İptal başarısız' },
      { status: 400 }
    );
  }
}
