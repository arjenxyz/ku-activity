import { NextResponse } from 'next/server';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';

type CodeRow = {
  id: string;
  code: string;
  label: string | null;
  request_email: string | null;
  notes: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  created_at: string;
  redeemed_by: string | null;
  project_id: string | null;
};

export async function GET() {
  try {
    await requireDeveloperUser();
    const supabase = await createClient();

    const { data: codes, error } = await supabase
      .from('verification_codes')
      .select(
        'id, code, label, request_email, notes, redeemed_at, revoked_at, expires_at, created_at, redeemed_by, project_id'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (codes ?? []) as CodeRow[];
    const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))] as string[];

    let projectNames: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      projectNames = Object.fromEntries((projects ?? []).map((p) => [p.id, p.name]));
    }

    const enriched = rows.map((row) => ({
      ...row,
      projects: row.project_id ? { name: projectNames[row.project_id] ?? '—' } : null,
    }));

    return NextResponse.json({ codes: enriched });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDeveloperUser();
    const body = await request.json();
    const { label, requestEmail, notes, expiresDays, code } = body as {
      label?: string;
      requestEmail?: string;
      notes?: string;
      expiresDays?: number;
      code?: string;
    };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_verification_code', {
      p_developer_id: user.id,
      p_code: code || null,
      p_label: label || null,
      p_request_email: requestEmail || null,
      p_notes: notes || null,
      p_expires_days: expiresDays ?? 90,
    });

    if (error) {
      if (error.message.includes('create_verification_code')) {
        return NextResponse.json({ error: '007_verification_system.sql çalıştırın' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ code: data }, { status: 201 });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
