import type { PaymentClaim } from '@/lib/payments/types';

/** Tiny SVG receipt placeholder (data URL) for demo review cards. */
function receiptSvg(lines: string[]) {
  const text = lines
    .map(
      (line, i) =>
        `<text x="24" y="${48 + i * 22}" font-family="ui-monospace,monospace" font-size="14" fill="#0E1548">${line}</text>`
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
  <rect width="360" height="220" rx="16" fill="#f8fafc"/>
  <rect x="12" y="12" width="336" height="196" rx="12" fill="#fff" stroke="#e2e8f0"/>
  <text x="24" y="40" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="#64748b">Örnek banka dekontu</text>
  ${text}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Seed awaiting-review claims for Abana demo participants. */
export const DEMO_PAYMENT_CLAIMS: PaymentClaim[] = [
  {
    id: 'claim_demo_mehmet',
    eventId: 'abana-2027',
    registrationNo: 'ABN-2027-000185',
    participantName: 'Mehmet Kaya',
    expectedAmount: 850,
    expectedCode: 'ABN-9C1M',
    receiptDataUrl: receiptSvg(['Açıklama: ABN-9C1M', 'Tutar: 850,00 TRY', 'IBAN: TR33 0006 1005 1978 6457 8413 26']),
    receiptFileName: 'dekont-mehmet.png',
    ocr: {
      code: 'ABN-9C1M',
      amount: 850,
      iban: 'TR330006100519786457841326',
      dateText: '8 Eki 2026',
      rawText: 'ABN-9C1M 850 TRY',
    },
    codeMatched: true,
    amountMatched: true,
    status: 'awaiting_review',
    submittedAt: '2026-10-08T14:22:00.000Z',
    reviewedAt: null,
    reviewedById: null,
    reviewedByName: null,
    reviewNote: '',
    disclaimerAck: false,
  },
  {
    id: 'claim_demo_seda',
    eventId: 'abana-2027',
    registrationNo: 'ABN-2027-000188',
    participantName: 'Seda Koç',
    expectedAmount: 850,
    expectedCode: 'ABN-5K3T',
    receiptDataUrl: receiptSvg(['Açıklama: ABANA', 'Tutar: 800,00 TRY', 'IBAN okunamadı']),
    receiptFileName: 'dekont-seda.png',
    ocr: {
      code: null,
      amount: 800,
      iban: null,
      dateText: '9 Eki 2026',
      rawText: 'ABANA 800 TRY',
    },
    codeMatched: false,
    amountMatched: false,
    status: 'awaiting_review',
    submittedAt: '2026-10-09T09:05:00.000Z',
    reviewedAt: null,
    reviewedById: null,
    reviewedByName: null,
    reviewNote: '',
    disclaimerAck: false,
  },
];
