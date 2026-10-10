import type { DemoRegistration } from '@/lib/demo/registrations-store';
import { getCatalogEvent } from '@/lib/events/catalog-store';
import { getParticipant } from '@/lib/payments/payment-store';

/** True when event has no fee, or payment is paid/waived. */
export function isRegistrationFeeCleared(reg: DemoRegistration) {
  const event = getCatalogEvent(reg.eventId);
  const feeAmount = event?.planning?.pricing?.feeAmount;
  if (typeof feeAmount !== 'number' || feeAmount <= 0) return true;
  const participant = getParticipant(reg.eventId, reg.registrationNo);
  if (!participant) return false;
  return participant.paymentStatus === 'paid' || participant.paymentStatus === 'waived';
}
