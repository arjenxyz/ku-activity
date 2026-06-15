# 05 — Veritabanı Tasarımı

## Genel bilgi

- **Motor:** PostgreSQL (Supabase)
- **Migration sayısı:** 40 dosya (`001` – `036` + ara enum dosyaları)
- **Yönetim:** `supabase/migrations/` — sıralı, idempotent olmayan değişiklikler dikkatle uygulanır
- **Güvenlik:** RLS + API katmanı `service_role`

---

## Temel tablolar

### Kimlik ve organizasyon

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Yönetici kullanıcı profili (`admin`, `developer`, `owner`) |
| `projects` | Şantiye / proje kayıtları |
| `employees` | Personel (yevmiye, pozisyon, işe giriş) |

### Puantaj ve finans

| Tablo | Açıklama |
|-------|----------|
| `work_logs` | Yevmiye + mesai + çift onay + itiraz alanları |
| `deductions` | Avans (`advance`) ve kesintiler |
| `minimum_wages` | Asgari ücret tamamlama ödemeleri |
| `payroll_periods` | Bordro dönemleri |
| `payroll_lines` | Personel bazlı bordro satırları |
| `wage_policies` | Şirket/proje maaş politikası (JSONB) |

### İşe alım ve sözleşme

| Tablo | Açıklama |
|-------|----------|
| `employee_registration_requests` | Bekleyen başvurular |
| `employee_sensitive_data` | Şifreli T.C., IBAN, doğum tarihi |
| `personnel_contracts` | Sözleşme metinleri (versiyonlu) |
| `contract_acceptances` | Onay kayıtları + OTP hash |
| `registration_codes` | Proje doğrulama kodları |

### Oturum ve denetim

| Tablo | Açıklama |
|-------|----------|
| `personnel_sessions` | Personel oturum token hash |
| `legal_dossier_exports` | Hukuki dosya export logları |

---

## work_logs — kritik alanlar

| Alan | Tip | Açıklama |
|------|-----|----------|
| `amount` | numeric | Çalışılan gün birimi (1 = tam, 0.5 = yarım) |
| `mesai_type` | enum | `none`, `ceyrek`, `yarim`, `tam` |
| `mesai_units` | numeric | Mesai birim toplamı |
| `approved` | boolean | **Trigger ile** iki onay sonrası true |
| `admin_confirmed_at` | timestamptz | Yönetici onayı |
| `employee_confirmed_at` | timestamptz | Personel onayı |
| `employee_dispute_note` | text | İtiraz metni |
| `employee_disputed_at` | timestamptz | İtiraz zamanı |

**Unique:** `(employee_id, date)` — aynı güne çift yevmiye engeli.

---

## wage_policies (migration 036)

```sql
wage_policies (
  id uuid PK,
  owner_id uuid → profiles,
  project_id uuid NULL → projects,  -- NULL = şirket varsayılanı
  use_company_default boolean,
  policy jsonb,  -- yevmiye tetikleyicileri, asgari referans, oranlama
  created_at, updated_at
)
```

---

## Önemli RPC fonksiyonları

| Fonksiyon | Amaç |
|-----------|------|
| `get_personnel_month_stats(employee_id, month)` | Aylık brüt, avans, kesinti, asgari, net |
| `get_personnel_dashboard(employee_id)` | Özet dashboard verisi |
| `validate_personnel_session(token_hash)` | Personel oturum doğrulama |
| `is_admin()` / `is_developer()` | Rol kontrolü |
| `can_access_project(project_id)` | Proje sahipliği |
| `delete_project(id)` | Güvenli proje silme |

### get_personnel_month_stats (güncel formül)

Migration `034` + `035` sonrası:

```
brüt = (work_days × daily_wage) + (mesai_units × daily_wage)
net = brüt − avanslar − kesintiler + asgari_tamamlamalar
```

---

## Migration kronolojisi (özet)

| Aralık | Konu |
|--------|------|
| 001–003 | Temel şema, proje yönetimi |
| 004–005 | Asgari, bordro, personel paneli |
| 006–010 | Login, doğrulama, sistem flag |
| 011–013 | Aylık istatistik RPC, fotoğraf, onarım |
| 014–017 | Dijital başvuru, PIN/TC giriş |
| 018–021 | Çift onay, mesai, sözleşme OTP |
| 022–026 | Hukuki dosya, OTP, kimlik benzersizliği |
| 027–032 | Developer wipe, red başvuru temizliği |
| 029 | İtiraz alanları |
| 030–031 | Admin proje izolasyonu, ownership |
| 033–034 | RPC anahtar uyumu, mesai ayrımı |
| 035 | Asgari net hesaba dahil |
| 036 | Maaş politikası tablosu |

**Production:** Migration’lar **sırayla** Supabase SQL Editor veya CLI ile uygulanmalıdır.

---

## View’lar

| View | Açıklama |
|------|----------|
| `projects_with_stats` | Proje + personel sayısı |
| `v_project_financial_summary` | Proje finans özeti |

---

## Seed dosyaları

| Dosya | İçerik |
|-------|--------|
| `seed_admin.sql` | Örnek admin |
| `seed_developer.sql` | Developer hesabı |
| `seed_contracts.sql` | Sözleşme metinleri |
| `seed_owner_newlifearjen.sql` | Owner seed |

---

## İlgili belgeler

- [İş Kuralları](./09-IS-KURALLARI.md)
- [Kurulum](./11-KURULUM-VE-DEPLOY.md)
