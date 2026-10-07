-- Başvuru sırasında personelin çektiği fotoğraf (onayda personele aktarılır)

alter table public.employee_registration_requests
  add column if not exists photo_path text;

comment on column public.employee_registration_requests.photo_path is
  'Storage: employee-photos/registrations/{id}.jpg';
