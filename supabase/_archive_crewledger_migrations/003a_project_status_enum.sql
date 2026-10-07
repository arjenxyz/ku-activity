-- =============================================================================
-- ADIM 1 / 2 — Enum değerlerini ekle
-- Supabase SQL Editor'da YALNIZCA bu dosyayı çalıştırın, sonra 003_project_management.sql
-- PostgreSQL: yeni enum değerleri commit edilmeden kullanılamaz.
-- =============================================================================

alter type public.project_status add value if not exists 'planned';
alter type public.project_status add value if not exists 'paused';
alter type public.project_status add value if not exists 'archived';
