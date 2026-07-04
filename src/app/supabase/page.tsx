import type { Metadata } from 'next';
import strings from '@json/src/app/supabase/page.json';
import { SupabaseStatusPage } from '@/components/supabase/SupabaseStatusPage';
import { getKeepaliveStatus } from '@/lib/supabase-keepalive';

export const metadata: Metadata = {
  title: strings.title,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SupabaseStatusRoute() {
  const status = await getKeepaliveStatus();
  return <SupabaseStatusPage status={status} />;
}
