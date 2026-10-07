-- Supabase keepalive (cron-job.org) çalışma geçmişi — /supabase durum sayfası için
CREATE TABLE IF NOT EXISTS supabase_keepalive_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ok boolean NOT NULL,
  project_count integer,
  duration_ms integer NOT NULL DEFAULT 0,
  error_message text,
  source text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supabase_keepalive_runs_created_at_idx
  ON supabase_keepalive_runs (created_at DESC);

COMMENT ON TABLE supabase_keepalive_runs IS
  'Her keepalive cron isteğinde gerçek DB sorgusu sonucu kaydedilir.';
