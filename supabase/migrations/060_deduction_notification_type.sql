-- Kesinti / avans kaydı bildirimi enum değeri

do $$ begin
  alter type public.personnel_notification_type add value 'deduction_added';
exception
  when duplicate_object then null;
end $$;
