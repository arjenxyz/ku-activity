-- Süresi dolan kapanış projelerini cron ile hızlı bulmak için

create index if not exists projects_closure_deadline_due_idx
  on public.projects (closure_deadline_at)
  where closure_phase in ('pending_consents', 'export_window')
    and closure_deadline_at is not null;
