-- Yalnızca gerçekten iletilen OTP e-postaları rate limit'e girer

alter table public.contract_otp_challenges
  add column if not exists email_sent_at timestamptz;

comment on column public.contract_otp_challenges.email_sent_at is
  'Brevo ile e-posta başarıyla gönderildiğinde set edilir; kotaya yalnızca bu kayıtlar dahil edilir.';

create index if not exists contract_otp_challenges_email_sent_idx
  on public.contract_otp_challenges (email, email_sent_at desc)
  where email_sent_at is not null;
