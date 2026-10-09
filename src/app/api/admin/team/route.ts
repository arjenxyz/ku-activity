import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { createClient } from '@/utils/supabase/server';
import {
  closeTeamOpening,
  createTeamOpening,
  getTeamSnapshot,
  reviewTeamApplication,
} from '@/lib/team/team-store';
import { countsFor, type TeamApplication, type TeamOpening } from '@/lib/team/types';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Yetkisiz' }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

async function liveSnapshot() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null;
  }

  const { data: openingsRaw, error: openingsError } = await supabase
    .from('team_openings')
    .select('id, title, description, is_open, created_at')
    .order('created_at', { ascending: false });

  if (openingsError) return null;

  const openings: TeamOpening[] = (openingsRaw ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    isOpen: Boolean(row.is_open),
    createdAt: row.created_at as string,
  }));

  const active = openings.find((row) => row.isOpen) ?? null;
  let applications: TeamApplication[] = [];

  if (active) {
    const { data: appsRaw } = await supabase
      .from('team_applications')
      .select('id, opening_id, profile_id, note, status, created_at, profiles(full_name, email)')
      .eq('opening_id', active.id)
      .order('created_at', { ascending: false });

    applications = (appsRaw ?? []).map((row) => {
      const profile = row.profiles as { full_name?: string; email?: string } | null;
      return {
        id: row.id as string,
        openingId: row.opening_id as string,
        profileId: row.profile_id as string,
        fullName: profile?.full_name?.trim() || 'Başvuran',
        email: profile?.email?.trim() || '',
        note: (row.note as string | null) ?? null,
        status: row.status as TeamApplication['status'],
        createdAt: row.created_at as string,
      };
    });
  }

  return {
    openings,
    activeOpening: active,
    applications,
    counts: countsFor(applications),
  };
}

export async function GET() {
  const { error, session } = await requireAdmin();
  if (error || !session) return error!;

  if (!session.demo) {
    const live = await liveSnapshot().catch(() => null);
    if (live) return NextResponse.json(live);
  }

  return NextResponse.json(getTeamSnapshot());
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error || !session) return error!;

  try {
    const body = (await request.json()) as {
      action?: 'create' | 'close';
      title?: string;
      description?: string;
      openingId?: string;
    };

    if (body.action === 'create') {
      if (!session.demo) {
        try {
          const supabase = await createClient();
          await supabase.from('team_openings').update({ is_open: false }).eq('is_open', true);
          const { error: insertError } = await supabase.from('team_openings').insert({
            title: (body.title ?? '').trim(),
            description: body.description?.trim() || null,
            is_open: true,
          });
          if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 400 });
          }
          const live = await liveSnapshot();
          if (live) return NextResponse.json(live);
        } catch {
          // Fall through to demo store.
        }
      }
      return NextResponse.json(
        createTeamOpening({ title: body.title ?? '', description: body.description })
      );
    }

    if (body.action === 'close') {
      if (!body.openingId) {
        return NextResponse.json({ error: 'openingId gerekli' }, { status: 400 });
      }
      if (!session.demo) {
        try {
          const supabase = await createClient();
          const { error: closeError } = await supabase
            .from('team_openings')
            .update({ is_open: false })
            .eq('id', body.openingId);
          if (closeError) {
            return NextResponse.json({ error: closeError.message }, { status: 400 });
          }
          const live = await liveSnapshot();
          if (live) return NextResponse.json(live);
        } catch {
          // Fall through to demo store.
        }
      }
      return NextResponse.json(closeTeamOpening(body.openingId));
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAdmin();
  if (error || !session) return error!;

  try {
    const body = (await request.json()) as {
      applicationId?: string;
      status?: 'accepted' | 'rejected';
    };

    if (!body.applicationId || (body.status !== 'accepted' && body.status !== 'rejected')) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    if (!session.demo) {
      try {
        const supabase = await createClient();
        const { error: updateError } = await supabase
          .from('team_applications')
          .update({ status: body.status })
          .eq('id', body.applicationId);
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }
        const live = await liveSnapshot();
        if (live) return NextResponse.json(live);
      } catch {
        // Fall through to demo store.
      }
    }

    return NextResponse.json(reviewTeamApplication(body.applicationId, body.status));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
