-- Reddedilmiş / süresi dolmuş başvuru kayıtlarını kaldır (fotoğraflar storage'da kalabilir)

delete from public.personnel_contract_acceptances
where registration_request_id in (
  select id from public.employee_registration_requests
  where status in ('rejected', 'expired')
);

delete from public.employee_registration_requests
where status in ('rejected', 'expired');
