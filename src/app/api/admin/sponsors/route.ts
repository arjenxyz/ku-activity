import { NextResponse } from 'next/server';
import { getSiteSession } from '@/lib/auth/get-site-session';
import {
  createSponsor,
  listAllSponsors,
  removeSponsor,
  updateSponsor,
} from '@/lib/sponsors/sponsors-store';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getSiteSession();
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  return NextResponse.json({
    sponsors: listAllSponsors().filter((row) => row.active),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      url?: string;
      logoUrl?: string;
      blurb?: string;
      about?: string;
    };
    const sponsor = createSponsor({
      name: body.name ?? '',
      url: body.url,
      logoUrl: body.logoUrl,
      blurb: body.blurb,
      about: body.about,
    });
    return NextResponse.json({
      sponsor,
      sponsors: listAllSponsors().filter((row) => row.active),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eklenemedi' },
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
      url?: string;
      logoUrl?: string;
      blurb?: string;
      about?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }
    const sponsor = updateSponsor(body.id, {
      name: body.name,
      url: body.url,
      logoUrl: body.logoUrl,
      blurb: body.blurb,
      about: body.about,
    });
    return NextResponse.json({
      sponsor,
      sponsors: listAllSponsors().filter((row) => row.active),
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
    removeSponsor(id);
    return NextResponse.json({
      ok: true,
      sponsors: listAllSponsors().filter((row) => row.active),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Silinemedi' },
      { status: 400 }
    );
  }
}
