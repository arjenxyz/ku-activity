-- ADIM 1 — Yeni kesinti tipleri (ayrı çalıştırın, commit sonrası 004b)
alter type public.deduction_type add value if not exists 'minimum';
alter type public.deduction_type add value if not exists 'subcontractor_cut';
