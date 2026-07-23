import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  requirePersonnelSession,
  requirePersonnelWritableSession,
  PersonnelClosureWriteBlockedError,
} from '@/lib/personnel-auth';
import { LIMITS, sanitizeOptionalText } from '@/lib/api-validation';
import strings from '@json/src/app/api/personnel/day-reports/route.json';

const ALLOWED_CATEGORIES = new Set(['work', 'mesai', 'advance', 'deduction', 'minimum']);

function parseCategories(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const next = [
    ...new Set(
      raw
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => ALLOWED_CATEGORIES.has(item))
    ),
  ];
  return next.length > 0 ? next : null;
}

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const date = new URL(request.url).searchParams.get('date')?.slice(0, 10) ?? null;
    const admin = createAdminClient();

    let q = admin
      .from('day_error_reports')
      .select('id, work_date, categories, note, status, created_at, resolved_at')
      .eq('employee_id', session.employeeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (date) q = q.eq('work_date', date);

    const { data, error } = await q;
    if (error) {
      if (error.message.includes('day_error_reports')) {
        return NextResponse.json({ reports: [], note: '077_day_error_reports.sql çalıştırın' });
      }
      return NextResponse.json({ error: strings.loadFailed }, { status: 500 });
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch {
    return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePersonnelWritableSession();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: strings.invalidBody }, { status: 400 });
    }

    const dateRaw = (body as { date?: unknown }).date;
    const date = typeof dateRaw === 'string' ? dateRaw.slice(0, 10) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: strings.invalidDate }, { status: 400 });
    }

    const categories = parseCategories((body as { categories?: unknown }).categories);
    if (!categories) {
      return NextResponse.json({ error: strings.categoriesRequired }, { status: 400 });
    }

    const note = sanitizeOptionalText((body as { note?: unknown }).note, LIMITS.note)?.trim() ?? '';
    if (note.length < 5) {
      return NextResponse.json({ error: strings.noteTooShort }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('day_error_reports')
      .insert({
        project_id: session.projectId,
        employee_id: session.employeeId,
        work_date: date,
        categories,
        note,
        status: 'open',
      })
      .select('id, work_date, categories, note, status, created_at')
      .single();

    if (error) {
      if (error.message.includes('day_error_reports')) {
        return NextResponse.json({ error: strings.migrationRequired }, { status: 503 });
      }
      return NextResponse.json({ error: strings.createFailed }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (err) {
    if (err instanceof PersonnelClosureWriteBlockedError) {
      return NextResponse.json({ error: strings.projectClosed }, { status: 423 });
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: strings.unauthorized }, { status: 401 });
    }
    return NextResponse.json({ error: strings.createFailed }, { status: 500 });
  }
}
