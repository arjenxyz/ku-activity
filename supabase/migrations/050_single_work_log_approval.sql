-- QR yoklama aktif: çift onay kaldırıldı — yönetici/QR kaydı yevmiyeyi doğrudan onaylar

-- Mevcut kayıtları onaylı yap
update public.work_logs
set
  admin_confirmed_at = coalesce(admin_confirmed_at, employee_confirmed_at, created_at, now()),
  employee_confirmed_at = coalesce(employee_confirmed_at, admin_confirmed_at, created_at, now()),
  employee_dispute_note = null,
  employee_disputed_at = null
where admin_confirmed_at is not null
   or employee_confirmed_at is not null;

update public.work_logs
set
  approved = true,
  approved_at = greatest(admin_confirmed_at, employee_confirmed_at)
where admin_confirmed_at is not null;

-- Tek onay: admin_confirmed_at yeterli (QR bitirince veya yönetici mesai girince)
create or replace function public.sync_work_log_approved()
returns trigger
language plpgsql
as $$
begin
  new.approved := new.admin_confirmed_at is not null;

  if new.approved then
    new.approved_at := coalesce(
      new.approved_at,
      new.admin_confirmed_at,
      new.employee_confirmed_at,
      now()
    );

    if new.block_id is null then
      new.block_id := public.resolve_work_log_block_id(new.employee_id, new.project_id);
    end if;

    if new.job_id is null then
      new.job_id := public.resolve_work_log_job_id(new.employee_id, new.project_id);
    end if;
  else
    new.approved_at := null;
  end if;

  new.mesai_units := case new.mesai_type
    when 'ceyrek' then 0.25
    when 'yarim' then 0.5
    when 'tam' then 1
    else 0
  end;

  return new;
end;
$$;
