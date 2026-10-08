import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { getDemoProfile, updateDemoProfile } from '@/lib/demo/profiles-store';
import { getSessionProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const session = await getSiteSession();
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  if (session.demo) {
    const profile = getDemoProfile(session.role);
    return NextResponse.json({ profile });
  }

  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({
      profile: {
        key: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        studentNo: profile.student_no,
        department: profile.department,
        classYear: profile.class_year,
        phone: (profile as { phone?: string | null }).phone ?? null,
        role: profile.role,
      },
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

  const body = (await request.json().catch(() => null)) as {
    fullName?: string;
    department?: string;
    classYear?: string;
    phone?: string;
  } | null;

  const patch = {
    fullName: body?.fullName?.trim() || undefined,
    department: body?.department?.trim() || undefined,
    classYear: body?.classYear?.trim() || undefined,
    phone: body?.phone?.replace(/\D/g, '').slice(0, 15) || undefined,
  };

  if (session.demo) {
    try {
      const profile = updateDemoProfile('student', patch);
      return NextResponse.json({ profile });
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
        full_name: patch.fullName,
        department: patch.department,
        class_year: patch.classYear,
        phone: patch.phone,
      })
      .eq('id', user.id)
      .select('id, full_name, email, student_no, department, class_year, phone, role')
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Güncellenemedi' }, { status: 400 });
    }
    return NextResponse.json({
      profile: {
        key: data.id,
        fullName: data.full_name,
        email: data.email,
        studentNo: data.student_no,
        department: data.department,
        classYear: data.class_year,
        phone: data.phone,
        role: data.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}
