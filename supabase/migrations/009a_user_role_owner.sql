-- Önce tek başına çalıştırın, sonra 009_owner_access.sql

do $$ begin
  alter type public.user_role add value 'owner';
exception
  when duplicate_object then null;
end $$;
