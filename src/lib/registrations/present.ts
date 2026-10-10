import type { DemoRegistration } from '@/lib/demo/registrations-store';
import { emptyPlanning, formatFeeTry } from '@/lib/events/catalog';
import { getCatalogEvent } from '@/lib/events/catalog-store';

export function attendanceLabel(reg: DemoRegistration) {
  if (reg.status === 'cancelled') return 'İptal';
  if (reg.status === 'pending') return 'Bekliyor';
  if (reg.attendance.length === 0) return 'Onaylı';
  const event = getCatalogEvent(reg.eventId);
  const last = reg.attendance[reg.attendance.length - 1];
  const day = event?.days.find((item) => item.id === last.dayId);
  return day ? `Katıldı · ${day.label}` : 'Katıldı';
}

export function presentRegistration(reg: DemoRegistration) {
  const event = getCatalogEvent(reg.eventId);
  const pricing = event?.planning?.pricing ?? emptyPlanning().pricing;
  const feeAmount = pricing.feeAmount;
  const needsPayment =
    reg.status !== 'cancelled' && typeof feeAmount === 'number' && feeAmount > 0;

  return {
    id: reg.id,
    eventId: reg.eventId,
    eventTitle: event?.title ?? reg.eventId,
    location: event?.location ?? '',
    registrationNo: reg.registrationNo,
    manualCode: reg.manualCode,
    status: reg.status,
    statusLabel: attendanceLabel(reg),
    logistics: reg.logistics,
    dayIds: reg.dayIds,
    activityIds: reg.activityIds,
    registeredAt: reg.registeredAt,
    attendanceCount: reg.attendance.length,
    canShowQr: reg.status === 'confirmed',
    canCancel:
      reg.status !== 'cancelled' &&
      Boolean(event && new Date() <= new Date(event.registrationDeadlineIso)),
    needsPayment,
    feeAmount,
    feeLabel: needsPayment ? formatFeeTry(feeAmount) : null,
    feeNotes: pricing.feeNotes || null,
    paymentIban: pricing.paymentIban || null,
    cashPaymentEnabled: Boolean(pricing.cashPaymentEnabled),
    cashContactName: pricing.cashContactName || null,
    cashContactNote: pricing.cashContactNote || null,
  };
}
