-- Sözleşme özeti ve onay anı içerik hash'i

alter table public.personnel_contracts
  add column if not exists summary text;

alter table public.personnel_contract_acceptances
  add column if not exists content_hash text;

comment on column public.personnel_contracts.summary is
  'Personel modalında gösterilen kısa özet (madde madde veya paragraf)';

comment on column public.personnel_contract_acceptances.content_hash is
  'Onay anındaki sözleşme metninin SHA-256 özeti (slug+version+content)';
