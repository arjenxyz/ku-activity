-- Sahipsiz (created_by null) projeler — tek yönetici geçişi ve otomatik sahiplik

-- Doğrulama kodu ile oluşturulmuş ama sahibi atanmamış projeler
update public.projects p
set created_by = vc.redeemed_by
from public.verification_codes vc
where p.verification_code_id = vc.id
  and p.created_by is null
  and vc.redeemed_by is not null;

-- Sistemde tek aktif admin varsa kalan sahipsiz projeleri ona bağla
do $$
declare
  v_admin_id uuid;
  v_admin_count int;
begin
  select count(*)::int into v_admin_count
  from public.profiles
  where role = 'admin' and is_active = true;

  if v_admin_count = 1 then
    select id into v_admin_id
    from public.profiles
    where role = 'admin' and is_active = true
    limit 1;

    update public.projects
    set created_by = v_admin_id
    where created_by is null;
  end if;
end $$;

-- Sahipsiz projeye erişim (yalnızca sahiplenene kadar — çoklu adminde ilk işlem kazanır)
create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.owns_project(p_project_id)
    or (
      public.is_admin()
      and not public.is_platform_admin()
      and exists (
        select 1 from public.projects
        where id = p_project_id
          and created_by is null
      )
    );
$$;

-- Oturumlu yönetici sahipsiz projeyi kendine bağlar (service role auth.uid() olmadığı için API'den de çağrılır)
create or replace function public.claim_orphan_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  if not public.is_admin() then
    return false;
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  if public.owns_project(p_project_id) then
    return true;
  end if;

  update public.projects
  set created_by = v_uid, updated_at = now()
  where id = p_project_id
    and created_by is null;

  return public.owns_project(p_project_id);
end;
$$;

grant execute on function public.claim_orphan_project(uuid) to authenticated;
