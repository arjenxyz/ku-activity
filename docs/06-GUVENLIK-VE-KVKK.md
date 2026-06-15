# 06 — Güvenlik ve KVKK

## Güvenlik modeli özeti

CrewLedger **savunma derinliği** (defense in depth) yaklaşımı kullanır:

1. **Ağ:** HTTPS (Vercel TLS)
2. **Uygulama:** Middleware route koruması
3. **API:** Rol ve proje sahipliği kontrolü
4. **Veritabanı:** RLS politikaları
5. **Veri:** Alan düzeyi şifreleme (hassas PII)
6. **Oturum:** HttpOnly cookie, hash’lenmiş personel token

---

## Hassas veri şifreleme

### Şifrelenen alanlar

| Alan | Saklama |
|------|---------|
| T.C. kimlik numarası | `employee_sensitive_data` (AES-256-GCM) |
| IBAN | Aynı tablo |
| Doğum tarihi | Aynı tablo |

### Uygulama

- Modül: `src/lib/field-encryption.ts`
- Anahtar: `FIELD_ENCRYPTION_KEY` (32 byte hex, env)
- Format: `iv:authTag:ciphertext` (base64 bileşenler)

### Arama (lookup)

Düz metin T.C. indekslenmez. **HMAC hash** ile arama:

- `tc_hash`, `phone_hash` alanları
- Personel girişinde T.C. ile eşleştirme

---

## Kimlik doğrulama

### Yönetici

- Supabase Auth (e-posta/şifre)
- Oturum cookie’leri SSR ile yönetilir
- Middleware: `/admin-panel/*` korumalı

### Personel

- PIN veya kimlik tabanlı giriş
- `personnel_sessions` — token **hash** saklanır (düz token DB’de yok)
- Cookie: `HttpOnly`, `Secure` (production), `SameSite`
- Sliding expiration

---

## Yetkilendirme

| Kontrol | Mekanizma |
|---------|-----------|
| Admin mi? | `is_admin()` RPC |
| Developer mı? | `is_developer()` RPC |
| Proje erişimi | `can_access_project()` — `created_by` eşleşmesi |
| Personel verisi | `employee_id` = oturumdaki personel |

**030_admin_project_isolation:** Bir yönetici başka yöneticinin projesini göremez.

---

## Row Level Security (RLS)

Tüm kritik tablolarda RLS etkin. Örnek politikalar:

- `profiles` — kullanıcı yalnızca kendi profilini okur
- `projects` — admin yalnızca sahip olduğu projeleri görür
- `minimum_wages`, `work_logs` — proje kiracı politikası

Personel API’leri çoğunlukla **service_role** ile sunucu tarafında filtrelenir; istemci doğrudan Supabase’e bağlanmaz.

---

## Çift onay — güvenlik açısından

`approved = true` yalnızca trigger ile set edilir:

- Tek taraflı manipülasyon (yalnızca admin veya yalnızca personel) maaşa yansımaz
- İtiraz kaydı silinmeden onay tamamlanamaz

---

## Dosya depolama

- Personel fotoğrafları: **private** Supabase Storage bucket
- Erişim: imzalı URL veya sunucu proxy
- Migration: `025_private_photo_storage.sql`

---

## Rate limiting

Kritik public endpoint’lerde Upstash Redis rate limit (opsiyonel):

- Başvuru API
- OTP gönderimi
- Giriş denemeleri

---

## KVKK uyumluluk yaklaşımı

| İlke | Uygulama |
|------|----------|
| **Veri minimizasyonu** | Personel panelinde T.C./IBAN maskelenir veya gösterilmez |
| **Amaç sınırlılığı** | Veriler yalnızca iş sözleşmesi ve ödeme için |
| **Şeffaflık** | Personel kendi kayıtlarını görür; Haklarım sekmesi |
| **Erişim hakkı** | Hukuki dosya indirme (kendi verisi) |
| **Güvenlik** | Şifreleme, erişim kontrolü |
| **Sözleşme onayı** | Scroll + OTP ile açık rıza izi |
| **Veri sorumlusu bilgisi** | `company-config.ts` env ile yapılandırılır |

### Personel hakları paneli

- KVKK bilgilendirme metni
- Veri sorumlusu iletişim
- Kendi hukuki dosyasını indirme

---

## Ortam değişkenleri (gizli)

| Değişken | Asla commit edilmez |
|----------|---------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ |
| `FIELD_ENCRYPTION_KEY` | ✓ |
| `BREVO_API_KEY` | ✓ |
| `CRON_SECRET` | ✓ |
| `REDIS_TOKEN` | ✓ |

`.env` dosyası `.gitignore` içindedir.

---

## Güvenlik kontrol listesi (deploy öncesi)

- [ ] `FIELD_ENCRYPTION_KEY` production’da set
- [ ] Service role key yalnızca sunucuda
- [ ] RLS tüm tablolarda test edildi
- [ ] HTTPS zorunlu
- [ ] Cron endpoint `CRON_SECRET` ile korunuyor
- [ ] Storage bucket public değil

---

## İlgili belgeler

- [Mimari](./03-MIMARI.md)
- [Kurulum](./11-KURULUM-VE-DEPLOY.md)
