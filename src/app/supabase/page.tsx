import type { Metadata } from 'next';
import { SupabaseStatusPage } from '@/components/supabase/SupabaseStatusPage';
import { getKeepaliveStatus } from '@/lib/supabase-keepalive';

export const metadata: Metadata = {
  title: 'Durum',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SupabaseStatusRoute() {
  const status = await getKeepaliveStatus();
  return <SupabaseStatusPage status={status} />;
}
