import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import {
  assignTeamMemberFromPerson,
  createManualTeamMember,
  listAllTeamMembers,
  listAssignablePeople,
  removeTeamMember,
  updateTeamMember,
} from '@/lib/team/members-store';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  return NextResponse.json({
    members: listAllTeamMembers().filter((row) => row.active),
    assignable: listAssignablePeople(),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: 'manual' | 'assign';
      name?: string;
      handle?: string;
      role?: string;
      about?: string;
      personId?: string;
    };

    if (body.action === 'manual') {
      const member = createManualTeamMember({
        name: body.name ?? '',
        handle: body.handle,
        role: body.role,
        about: body.about,
      });
      return NextResponse.json({
        member,
        members: listAllTeamMembers().filter((row) => row.active),
        assignable: listAssignablePeople(),
      });
    }

    if (body.action === 'assign') {
      if (!body.personId) {
        return NextResponse.json({ error: 'personId gerekli' }, { status: 400 });
      }
      const member = assignTeamMemberFromPerson({
        personId: body.personId,
        role: body.role,
        about: body.about,
      });
      return NextResponse.json({
        member,
        members: listAllTeamMembers().filter((row) => row.active),
        assignable: listAssignablePeople(),
      });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'İşlem başarısız' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      handle?: string;
      role?: string;
      about?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }
    const member = updateTeamMember(body.id, {
      name: body.name,
      handle: body.handle,
      role: body.role,
      about: body.about,
    });
    return NextResponse.json({
      member,
      members: listAllTeamMembers().filter((row) => row.active),
      assignable: listAssignablePeople(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Güncellenemedi' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }
    removeTeamMember(id);
    return NextResponse.json({
      ok: true,
      members: listAllTeamMembers().filter((row) => row.active),
      assignable: listAssignablePeople(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Silinemedi' },
      { status: 400 }
    );
  }
}
