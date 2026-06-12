-- Supabase: DELETE requires a WHERE clause — wipe fonksiyonunu güncelle

create or replace function public.developer_wipe_application_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counts jsonb := '{}'::jsonb;
  v_n bigint;
begin
  if auth.uid() is null or not public.is_developer() then
    raise exception 'UNAUTHORIZED';
  end if;

  delete from public.legal_dossier_exports where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('legal_dossier_exports', v_n);

  delete from public.personnel_contract_acceptances where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('personnel_contract_acceptances', v_n);

  delete from public.contract_otp_challenges where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('contract_otp_challenges', v_n);

  delete from public.employee_registration_requests where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employee_registration_requests', v_n);

  delete from public.payroll_lines where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_lines', v_n);

  delete from public.payroll_periods where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_periods', v_n);

  delete from public.minimum_wages where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('minimum_wages', v_n);

  delete from public.personnel_sessions where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('personnel_sessions', v_n);

  delete from public.work_logs where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('work_logs', v_n);

  delete from public.deductions where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('deductions', v_n);

  delete from public.employee_sensitive_data where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employee_sensitive_data', v_n);

  delete from public.employees where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employees', v_n);

  delete from public.project_dashboards where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('project_dashboards', v_n);

  delete from public.payroll_processing where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_processing', v_n);

  delete from public.system_uptime where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('system_uptime', v_n);

  update public.projects set verification_code_id = null where verification_code_id is not null;

  delete from public.verification_codes where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('verification_codes', v_n);

  delete from public.projects where true;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('projects', v_n);

  return jsonb_build_object('ok', true, 'deleted', v_counts);
end;
$$;

revoke all on function public.developer_wipe_application_data() from public;
grant execute on function public.developer_wipe_application_data() to authenticated;
