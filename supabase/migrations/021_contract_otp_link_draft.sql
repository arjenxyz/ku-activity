-- E-posta OTP: magic link + başvuru taslağı (link ile tek tıkla gönderim)

alter table public.contract_otp_challenges
  add column if not exists link_token text unique,
  add column if not exists draft_json jsonb,
  add column if not exists draft_photo_path text,
  add column if not exists draft_contract_acceptances jsonb,
  add column if not exists submitted_at timestamptz;

create index if not exists contract_otp_challenges_link_token_idx
  on public.contract_otp_challenges (link_token)
  where link_token is not null;

comment on column public.contract_otp_challenges.link_token is
  'E-postadaki tek tıkla doğrulama bağlantısı';

comment on column public.contract_otp_challenges.draft_json is
  'Başvuru formu taslağı (kısa ömürlü, yalnızca service_role)';
