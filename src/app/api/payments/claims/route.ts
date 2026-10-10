import { NextResponse } from 'next/server';
import { extractReceiptText, parseReceiptText } from '@/lib/payments/ocr';
import {
  createTransferClaim,
  getParticipant,
  listAwaitingClaims,
  listClaims,
  reviewClaim,
} from '@/lib/payments/payment-store';
import {
  isAllowedReceiptFile,
  RECEIPT_FILE_TYPE_ERROR,
} from '@/lib/payments/receipt-file';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') ?? undefined;
  const awaiting = searchParams.get('awaiting') === '1';
  const claims = awaiting
    ? listAwaitingClaims().filter((claim) => (eventId ? claim.eventId === eventId : true))
    : listClaims(eventId);
  return NextResponse.json({ claims });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const eventId = String(form.get('eventId') ?? '');
    const registrationNo = String(form.get('registrationNo') ?? '');
    const file = form.get('receipt');

    if (!eventId || !registrationNo) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dekont dosyası gerekli' }, { status: 400 });
    }
    if (!isAllowedReceiptFile(file)) {
      return NextResponse.json({ error: RECEIPT_FILE_TYPE_ERROR }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Dosya en fazla 4 MB olabilir' }, { status: 400 });
    }

    const participant = getParticipant(eventId, registrationNo);
    if (!participant) {
      return NextResponse.json({ error: 'Katılımcı bulunamadı' }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'application/octet-stream';
    const rawText = await extractReceiptText(buffer, mime);
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    const ocr = parseReceiptText(rawText, participant.paymentCode);

    const result = createTransferClaim({
      eventId,
      registrationNo,
      receiptDataUrl: dataUrl,
      receiptFileName: file.name || 'dekont',
      ocr,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Yükleme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      claimId?: string;
      approve?: boolean;
      disclaimerAck?: boolean;
      note?: string;
      reviewerId?: string;
      reviewerName?: string;
    };

    if (!body.claimId || typeof body.approve !== 'boolean') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const result = reviewClaim({
      claimId: body.claimId,
      approve: body.approve,
      disclaimerAck: Boolean(body.disclaimerAck),
      note: body.note,
      reviewerId: body.reviewerId?.trim() || 'demo-admin',
      reviewerName: body.reviewerName?.trim() || 'Demo Admin',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
