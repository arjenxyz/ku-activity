-- Developer panel: tüm uygulama verilerini sıfırlama (profil/auth korunur)

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

  delete from public.legal_dossier_exports;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('legal_dossier_exports', v_n);

  delete from public.personnel_contract_acceptances;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('personnel_contract_acceptances', v_n);

  delete from public.contract_otp_challenges;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('contract_otp_challenges', v_n);

  delete from public.employee_registration_requests;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employee_registration_requests', v_n);

  delete from public.payroll_lines;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_lines', v_n);

  delete from public.payroll_periods;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_periods', v_n);

  delete from public.minimum_wages;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('minimum_wages', v_n);

  delete from public.personnel_sessions;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('personnel_sessions', v_n);

  delete from public.work_logs;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('work_logs', v_n);

  delete from public.deductions;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('deductions', v_n);

  delete from public.employee_sensitive_data;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employee_sensitive_data', v_n);

  delete from public.employees;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('employees', v_n);

  delete from public.project_dashboards;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('project_dashboards', v_n);

  delete from public.payroll_processing;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('payroll_processing', v_n);

  delete from public.system_uptime;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('system_uptime', v_n);

  update public.projects set verification_code_id = null where verification_code_id is not null;

  delete from public.verification_codes;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('verification_codes', v_n);

  delete from public.projects;
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('projects', v_n);

  return jsonb_build_object('ok', true, 'deleted', v_counts);
end;
$$;

revoke all on function public.developer_wipe_application_data() from public;
grant execute on function public.developer_wipe_application_data() to authenticated;
