import type { Metadata } from 'next';
import { SupabaseStatusPage } from '@/components/supabase/SupabaseStatusPage';
import { getKeepaliveStatus } from '@/lib/supabase-keepalive';

export const metadata: Metadata = {
  title: 'Supabase Durumu | CrewLedger',
  description: 'Supabase keepalive ve veritabanı bağlantı durumu',
};

export const dynamic = 'force-dynamic';

export default async function SupabaseStatusRoute() {
  const status = await getKeepaliveStatus();

  return (
    <SupabaseStatusPage
      initial={{
        ...status,
        checkedAt: new Date().toISOString(),
      }}
    />
  );
}
