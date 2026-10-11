import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { getDemoProfile, updateDemoProfile } from '@/lib/demo/profiles-store';
import { getSessionProfile } from '@/lib/auth/get-profile';
import { validateProfilePatch } from '@/lib/profile/validate';
import { createClient } from '@/utils/supabase/server';

function toClientProfile(row: {
  key?: string;
  id?: string;
  fullName?: string | null;
  full_name?: string | null;
  email?: string | null;
  studentNo?: string | null;
  student_no?: string | null;
  department?: string | null;
  classYear?: string | null;
  class_year?: string | null;
  phone?: string | null;
  role?: string | null;
}) {
  return {
    key: row.key ?? row.id ?? '',
    fullName: row.fullName ?? row.full_name ?? null,
    email: row.email ?? null,
    studentNo: row.studentNo ?? row.student_no ?? null,
    department: row.department ?? null,
    classYear: row.classYear ?? row.class_year ?? null,
    phone: row.phone ?? null,
    role: row.role ?? null,
  };
}

export async function GET() {
  const session = await getSiteSession();
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  if (session.demo) {
    const profile = getDemoProfile(session.role);
    if (!profile) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ profile: toClientProfile(profile) });
  }

  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({
      profile: toClientProfile({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        student_no: profile.student_no,
        department: profile.department,
        class_year: profile.class_year,
        phone: (profile as { phone?: string | null }).phone ?? null,
        role: profile.role,
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Profil okunamadı' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSiteSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Öğrenci oturumu gerekli' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const raw = (body ?? {}) as {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    department?: string;
    classYear?: string;
    phone?: string;
    otherDepartment?: string;
  };

  const validated = validateProfilePatch(raw);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, field: validated.field },
      { status: 400 }
    );
  }

  const { fullName, department, classYear, phone } = validated.data;

  if (session.demo) {
    try {
      const profile = updateDemoProfile('student', {
        fullName,
        department,
        classYear,
        phone,
      });
      return NextResponse.json({ profile: toClientProfile(profile) });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Güncellenemedi' },
        { status: 400 }
      );
    }
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department,
        class_year: classYear,
        phone,
      })
      .eq('id', user.id)
      .select('id, full_name, email, student_no, department, class_year, phone, role')
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Güncellenemedi' },
        { status: 400 }
      );
    }
    return NextResponse.json({ profile: toClientProfile(data) });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}
