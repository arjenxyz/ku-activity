-- Personel: geçmiş yoklama / bordro değişiklik bildirimleri

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'attendance_did_not_work';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'work_log_recorded';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'work_log_updated';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'work_log_deleted';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'deduction_updated';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'deduction_removed';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'minimum_wage_updated';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'minimum_wage_removed';
exception
  when duplicate_object then null;
end $$;
