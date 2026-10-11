import { removeRegistrationsForEvent } from '@/lib/demo/registrations-store';
import { deleteCatalogEvent } from '@/lib/events/catalog-store';
import { purgePaymentDataForEvent } from '@/lib/payments/payment-store';
import { createAdminClient } from '@/utils/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Deletes an event from the in-memory catalog and related demo data,
 * then removes matching rows from Supabase (children cascade via FK).
 * Does not touch profiles, team tables, or other events.
 */
export async function purgeEventEverywhere(eventId: string) {
  const removed = deleteCatalogEvent(eventId);
  const registrationsRemoved = removeRegistrationsForEvent(eventId);
  const paymentsRemoved = purgePaymentDataForEvent(eventId);

  let supabaseDeleted = 0;
  let supabaseError: string | null = null;

  try {
    const supabase = createAdminClient();
    const ids = new Set<string>();

    if (UUID_RE.test(eventId)) {
      ids.add(eventId);
    }

    // Demo catalog uses slug ids; match Supabase rows by title + start time when possible.
    const { data: byMeta, error: metaError } = await supabase
      .from('events')
      .select('id')
      .eq('title', removed.title)
      .eq('starts_at', removed.startsAtIso);

    if (metaError) {
      supabaseError = metaError.message;
    } else {
      for (const row of byMeta ?? []) {
        if (row?.id) ids.add(String(row.id));
      }
    }

    if (!supabaseError && ids.size === 0) {
      const { data: byTitle, error: titleError } = await supabase
        .from('events')
        .select('id')
        .eq('title', removed.title)
        .limit(5);
      if (titleError) {
        supabaseError = titleError.message;
      } else if ((byTitle?.length ?? 0) === 1 && byTitle?.[0]?.id) {
        ids.add(String(byTitle[0].id));
      }
    }

    for (const id of ids) {
      const { error, count } = await supabase
        .from('events')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) {
        supabaseError = error.message;
        break;
      }
      supabaseDeleted += count ?? 0;
    }
  } catch (err) {
    // Local/demo without service role: catalog delete still succeeds.
    supabaseError = err instanceof Error ? err.message : 'Supabase silinemedi';
  }

  return {
    event: removed,
    registrationsRemoved,
    paymentsRemoved,
    supabaseDeleted,
    supabaseError,
  };
}
