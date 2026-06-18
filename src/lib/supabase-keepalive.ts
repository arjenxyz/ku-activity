import { createAdminClient } from '@/utils/supabase/admin';

export type KeepaliveRun = {
  id: string;
  ok: boolean;
  projectCount: number | null;
  durationMs: number;
  errorMessage: string | null;
  source: string | null;
  createdAt: string;
};

export type KeepaliveStatus = {
  tableReady: boolean;
  overall: 'ok' | 'warning' | 'critical' | 'unknown';
  headline: string;
  detail: string;
  lastSuccess: KeepaliveRun | null;
  lastFailure: KeepaliveRun | null;
  lastRun: KeepaliveRun | null;
  recentRuns: KeepaliveRun[];
  pauseRiskDaysLeft: number | null;
  dbReachable: boolean;
};

const PAUSE_AFTER_DAYS = 7;
const OK_WITHIN_HOURS = 12;
const WARNING_WITHIN_HOURS = 24;

function mapRow(row: Record<string, unknown>): KeepaliveRun {
  return {
    id: String(row.id),
    ok: Boolean(row.ok),
    projectCount: row.project_count == null ? null : Number(row.project_count),
    durationMs: Number(row.duration_ms ?? 0),
    errorMessage: row.error_message ? String(row.error_message) : null,
    source: row.source ? String(row.source) : null,
    createdAt: String(row.created_at),
  };
}

export function inferKeepaliveSource(userAgent: string | null): string {
  const ua = (userAgent ?? '').toLowerCase();
  if (ua.includes('cron-job.org') || ua.includes('cronjob')) return 'cron-job.org';
  if (ua.includes('vercel')) return 'vercel-cron';
  if (ua.includes('curl')) return 'curl / cron servisi';
  if (ua.trim()) return 'harici istemci';
  return 'bilinmiyor';
}

export async function recordKeepaliveRun(input: {
  ok: boolean;
  projectCount?: number | null;
  durationMs: number;
  errorMessage?: string | null;
  userAgent?: string | null;
}) {
  const admin = createAdminClient();
  const source = inferKeepaliveSource(input.userAgent ?? null);

  const { error } = await admin.from('supabase_keepalive_runs').insert({
    ok: input.ok,
    project_count: input.projectCount ?? null,
    duration_ms: input.durationMs,
    error_message: input.errorMessage ?? null,
    source,
    user_agent: input.userAgent?.slice(0, 500) ?? null,
  });

  if (error) {
    console.error('[keepalive] kayıt yazılamadı:', error.message);
  }
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function formatHoursAgo(hours: number): string {
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} dakika önce`;
  }
  if (hours < 48) return `${Math.round(hours)} saat önce`;
  const days = Math.round(hours / 24);
  return `${days} gün önce`;
}

export async function getKeepaliveStatus(): Promise<KeepaliveStatus> {
  const admin = createAdminClient();

  const dbReachable = true;
  const { data: runs, error } = await admin
    .from('supabase_keepalive_runs')
    .select('id, ok, project_count, duration_ms, error_message, source, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    const missingTable =
      error.message.includes('does not exist') ||
      error.message.includes('Could not find the table');
    return {
      tableReady: !missingTable,
      overall: missingTable ? 'unknown' : 'critical',
      headline: missingTable ? 'Durum tablosu henüz yok' : 'Durum okunamadı',
      detail: missingTable
        ? '041_supabase_keepalive_log.sql migration’ını Supabase’de çalıştırın.'
        : error.message,
      lastSuccess: null,
      lastFailure: null,
      lastRun: null,
      recentRuns: [],
      pauseRiskDaysLeft: null,
      dbReachable: !missingTable,
    };
  }

  const recentRuns = (runs ?? []).map((r) => mapRow(r as Record<string, unknown>));
  const lastRun = recentRuns[0] ?? null;
  const lastSuccess = recentRuns.find((r) => r.ok) ?? null;
  const lastFailure = recentRuns.find((r) => !r.ok) ?? null;

  if (!lastSuccess) {
    return {
      tableReady: true,
      overall: 'unknown',
      headline: 'Henüz başarılı keepalive yok',
      detail:
        'cron-job.org job’u kurulduğunda burada gerçek veritabanı sorgusu sonuçları görünecek.',
      lastSuccess: null,
      lastFailure,
      lastRun,
      recentRuns,
      pauseRiskDaysLeft: null,
      dbReachable,
    };
  }

  const hours = hoursSince(lastSuccess.createdAt);
  const pauseRiskDaysLeft = Math.max(
    0,
    Math.ceil(PAUSE_AFTER_DAYS - hours / 24)
  );

  let overall: KeepaliveStatus['overall'] = 'ok';
  let headline = 'Her şey yolunda';
  let detail = `Son gerçek DB sorgusu ${formatHoursAgo(hours)} başarılı.`;

  if (hours > WARNING_WITHIN_HOURS) {
    overall = 'critical';
    headline = 'Keepalive gecikmiş';
    detail = `Son başarılı ping ${formatHoursAgo(hours)}. Supabase ~${PAUSE_AFTER_DAYS} gün hareketsizlikte duraklar.`;
  } else if (hours > OK_WITHIN_HOURS) {
    overall = 'warning';
    headline = 'Ping biraz eski';
    detail = `Son başarı ${formatHoursAgo(hours)}. cron-job.org sıklığını kontrol edin (öneri: 6 saatte bir).`;
  }

  return {
    tableReady: true,
    overall,
    headline,
    detail,
    lastSuccess,
    lastFailure,
    lastRun,
    recentRuns,
    pauseRiskDaysLeft,
    dbReachable,
  };
}
