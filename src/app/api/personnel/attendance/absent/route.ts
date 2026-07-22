import { NextResponse } from 'next/server';

/**
 * Personel kendi kendine “işe çıkmadım” bildiremez.
 * Gelmeyenleri usta/admin yoklama listesinden çıkarır.
 */
const GONE = {
  error: 'Bu işlem personel tarafından yapılamaz. Gelmeyenleri usta yoklama listesinden çıkarır.',
};

export async function POST() {
  return NextResponse.json(GONE, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json(GONE, { status: 403 });
}

export async function GET() {
  return NextResponse.json(GONE, { status: 403 });
}
