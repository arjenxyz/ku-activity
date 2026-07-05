-- Yoklama oturumu tamamlandı bildirimi

do $$ begin
  alter type public.personnel_notification_type add value if not exists 'attendance_session_completed';
exception
  when duplicate_object then null;
end $$;
