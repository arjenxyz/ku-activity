import { DEMO_PARTICIPANTS, type DemoParticipant } from '@/lib/demo/data';
import { DEMO_PAYMENT_CLAIMS } from '@/lib/payments/demo-claims';
import type {
  CashHandoff,
  CustodyChannel,
  CustodyTransfer,
  PaymentClaim,
  PaymentOcrResult,
} from '@/lib/payments/types';

type Store = {
  participants: DemoParticipant[];
  claims: PaymentClaim[];
  handoffs: CashHandoff[];
  custody: CustodyTransfer[];
};

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsPaymentStoreV2?: Store };
  if (!g.__emsPaymentStoreV2) {
    g.__emsPaymentStoreV2 = {
      participants: structuredClone(DEMO_PARTICIPANTS),
      claims: structuredClone(DEMO_PAYMENT_CLAIMS),
      handoffs: [],
      custody: [],
    };
  }
  return g.__emsPaymentStoreV2;
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listParticipants() {
  return store().participants.map((row) => ({ ...row }));
}

export function listParticipantsForEvent(eventId: string) {
  return store().participants.filter((row) => row.eventId === eventId).map((row) => ({ ...row }));
}

export function getParticipant(eventId: string, registrationNo: string) {
  const decoded = decodeURIComponent(registrationNo);
  const row = store().participants.find(
    (item) => item.eventId === eventId && item.registrationNo === decoded
  );
  return row ? { ...row } : null;
}

function mutateParticipant(
  eventId: string,
  registrationNo: string,
  patch: Partial<DemoParticipant>
) {
  const row = store().participants.find(
    (item) => item.eventId === eventId && item.registrationNo === registrationNo
  );
  if (!row) throw new Error('Katılımcı bulunamadı');
  Object.assign(row, patch);
  return { ...row };
}

export function listClaims(eventId?: string) {
  return store()
    .claims.filter((claim) => (eventId ? claim.eventId === eventId : true))
    .map((claim) => ({ ...claim }));
}

export function listAwaitingClaims() {
  return store()
    .claims.filter((claim) => claim.status === 'awaiting_review')
    .map((claim) => ({ ...claim }));
}

export function createTransferClaim(input: {
  eventId: string;
  registrationNo: string;
  receiptDataUrl: string;
  receiptFileName: string;
  ocr: PaymentOcrResult;
}) {
  const participant = store().participants.find(
    (row) => row.eventId === input.eventId && row.registrationNo === input.registrationNo
  );
  if (!participant) throw new Error('Katılımcı bulunamadı');
  if (participant.paymentAmount <= 0) throw new Error('Bu etkinlik ücretsiz');
  if (participant.paymentStatus === 'paid' || participant.paymentStatus === 'waived') {
    throw new Error('Ödeme zaten tamamlanmış');
  }

  const codeMatched =
    !!input.ocr.code &&
    input.ocr.code.toUpperCase() === participant.paymentCode.toUpperCase();
  const amountMatched =
    input.ocr.amount != null &&
    Math.abs(input.ocr.amount - participant.paymentAmount) <= 1;

  const open = store().claims.find(
    (claim) =>
      claim.registrationNo === participant.registrationNo &&
      claim.status === 'awaiting_review'
  );
  if (open) throw new Error('Zaten incelemede bir dekont var');

  const claim: PaymentClaim = {
    id: uid('claim'),
    eventId: participant.eventId,
    registrationNo: participant.registrationNo,
    participantName: participant.name,
    expectedAmount: participant.paymentAmount,
    expectedCode: participant.paymentCode,
    receiptDataUrl: input.receiptDataUrl,
    receiptFileName: input.receiptFileName,
    ocr: input.ocr,
    codeMatched,
    amountMatched,
    status: 'awaiting_review',
    submittedAt: nowIso(),
    reviewedAt: null,
    reviewedById: null,
    reviewedByName: null,
    reviewNote: '',
    disclaimerAck: false,
  };

  store().claims.unshift(claim);
  mutateParticipant(participant.eventId, participant.registrationNo, {
    paymentStatus: 'claimed',
    paymentMethod: 'transfer',
    paymentNote: 'Dekont yüklendi — admin incelemesi bekleniyor',
  });

  return { claim: { ...claim }, participant: getParticipant(participant.eventId, participant.registrationNo)! };
}

export function reviewClaim(input: {
  claimId: string;
  approve: boolean;
  reviewerId: string;
  reviewerName: string;
  disclaimerAck: boolean;
  note?: string;
}) {
  const claim = store().claims.find((row) => row.id === input.claimId);
  if (!claim) throw new Error('Talep bulunamadı');
  if (claim.status !== 'awaiting_review') throw new Error('Talep zaten sonuçlanmış');
  if (input.approve && !input.disclaimerAck) {
    throw new Error('Onay için sorumluluk metnini kabul etmelisiniz');
  }

  claim.status = input.approve ? 'approved' : 'rejected';
  claim.reviewedAt = nowIso();
  claim.reviewedById = input.reviewerId;
  claim.reviewedByName = input.reviewerName;
  claim.reviewNote = input.note?.trim() ?? '';
  claim.disclaimerAck = input.approve ? input.disclaimerAck : false;

  if (input.approve) {
    mutateParticipant(claim.eventId, claim.registrationNo, {
      paymentStatus: 'paid',
      paidAmount: claim.expectedAmount,
      paymentMethod: 'transfer',
      paymentNote: claim.reviewNote || 'Admin onaylı havale',
      custodianStaffId: input.reviewerId,
      custodianName: input.reviewerName,
    });
  } else {
    mutateParticipant(claim.eventId, claim.registrationNo, {
      paymentStatus: 'rejected',
      paymentNote: claim.reviewNote || 'Dekont reddedildi — yeniden yükleyin',
    });
  }

  return {
    claim: { ...claim },
    participant: getParticipant(claim.eventId, claim.registrationNo)!,
  };
}

export function createCashHandoff(eventId: string, registrationNo: string) {
  const participant = store().participants.find(
    (row) => row.eventId === eventId && row.registrationNo === registrationNo
  );
  if (!participant) throw new Error('Katılımcı bulunamadı');
  if (participant.paymentAmount <= 0) throw new Error('Bu etkinlik ücretsiz');
  if (participant.paymentStatus === 'paid' || participant.paymentStatus === 'waived') {
    throw new Error('Ödeme zaten tamamlanmış');
  }

  const token = `ems_cash_${uid('h')}`;
  const handoff: CashHandoff = {
    token,
    eventId,
    registrationNo,
    amount: participant.paymentAmount - participant.paidAmount,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    consumedAt: null,
  };
  store().handoffs.unshift(handoff);
  return { ...handoff };
}

export function acceptCashHandoff(input: {
  token: string;
  staffId: string;
  staffName: string;
}) {
  const handoff = store().handoffs.find((row) => row.token === input.token);
  if (!handoff) throw new Error('Geçersiz teslim kodu');
  if (handoff.consumedAt) throw new Error('Bu QR zaten kullanıldı');
  if (new Date(handoff.expiresAt).getTime() < Date.now()) {
    throw new Error('QR süresi dolmuş');
  }

  handoff.consumedAt = nowIso();
  const participant = mutateParticipant(handoff.eventId, handoff.registrationNo, {
    paymentStatus: 'paid',
    paidAmount: store().participants.find(
      (row) => row.registrationNo === handoff.registrationNo
    )!.paymentAmount,
    paymentMethod: 'cash',
    paymentNote: `Elden teslim · ${input.staffName}`,
    custodianStaffId: input.staffId,
    custodianName: input.staffName,
  });

  return { handoff: { ...handoff }, participant };
}

export function createCustodyTransfer(input: {
  eventId: string;
  amount: number;
  channel: CustodyChannel;
  fromStaffId: string;
  fromStaffName: string;
  note?: string;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Tutar geçersiz');
  }
  const transfer: CustodyTransfer = {
    id: uid('custody'),
    eventId: input.eventId,
    amount: input.amount,
    channel: input.channel,
    fromStaffId: input.fromStaffId,
    fromStaffName: input.fromStaffName,
    toStaffId: null,
    toStaffName: null,
    token: `ems_custody_${uid('t')}`,
    status: 'pending',
    note: input.note?.trim() ?? '',
    createdAt: nowIso(),
    completedAt: null,
  };
  store().custody.unshift(transfer);
  return { ...transfer };
}

export function completeCustodyTransfer(input: {
  token: string;
  toStaffId: string;
  toStaffName: string;
}) {
  const transfer = store().custody.find((row) => row.token === input.token);
  if (!transfer) throw new Error('Geçersiz devir kodu');
  if (transfer.status !== 'pending') throw new Error('Devir tamamlanmış veya iptal');
  if (transfer.fromStaffId === input.toStaffId) {
    throw new Error('Aynı yetkiliye devredilemez');
  }

  transfer.status = 'completed';
  transfer.toStaffId = input.toStaffId;
  transfer.toStaffName = input.toStaffName;
  transfer.completedAt = nowIso();

  // Move custodianship for paid cash/transfer rows under this event held by fromStaff
  for (const row of store().participants) {
    if (
      row.eventId === transfer.eventId &&
      row.paymentStatus === 'paid' &&
      row.custodianStaffId === transfer.fromStaffId
    ) {
      row.custodianStaffId = input.toStaffId;
      row.custodianName = input.toStaffName;
      row.paymentNote = `${row.paymentNote ? `${row.paymentNote} · ` : ''}Devir → ${input.toStaffName}`;
    }
  }

  return { ...transfer };
}

export function listCustody(eventId?: string) {
  return store()
    .custody.filter((row) => (eventId ? row.eventId === eventId : true))
    .map((row) => ({ ...row }));
}

export function custodyHeldBy(eventId: string) {
  const map = new Map<string, { staffId: string; staffName: string; amount: number; count: number }>();
  for (const row of store().participants) {
    if (row.eventId !== eventId || row.paymentStatus !== 'paid' || !row.custodianStaffId) continue;
    const key = row.custodianStaffId;
    const prev = map.get(key) ?? {
      staffId: row.custodianStaffId,
      staffName: row.custodianName ?? 'Yetkili',
      amount: 0,
      count: 0,
    };
    prev.amount += row.paidAmount;
    prev.count += 1;
    map.set(key, prev);
  }
  return [...map.values()];
}

export function getHandoff(token: string) {
  const row = store().handoffs.find((item) => item.token === token);
  return row ? { ...row } : null;
}

export function getCustodyByToken(token: string) {
  const row = store().custody.find((item) => item.token === token);
  return row ? { ...row } : null;
}
