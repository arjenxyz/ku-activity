-- Önce bunu tek başına çalıştırın (commit), sonra 007_verification_system.sql

do $$ begin
  alter type public.user_role add value 'developer';
exception
  when duplicate_object then null;
end $$;
