# 10 — API Referansı (Özet)

Tüm endpoint’ler JSON döner. Hata formatı: `{ "error": "mesaj" }`

**Base URL:** `https://crewledger.vercel.app` (veya yerel `http://localhost:3000`)

---

## Kimlik doğrulama

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/auth/admin/register` | Yönetici kayıt |
| POST | `/api/auth/admin/logout` | Yönetici çıkış |
| POST | `/api/auth/personnel/login` | Personel giriş |
| POST | `/api/auth/personnel/logout` | Personel çıkış |
| GET | `/api/auth/personnel/projects` | Giriş öncesi proje listesi |
| GET | `/api/auth/personnel/employees` | Proje personel listesi (giriş) |

---

## Yönetici — proje

| Method | Path | Açıklama |
|--------|------|----------|
| GET/POST | `/api/admin/projects` | Proje listesi / oluştur |
| GET/PATCH/DELETE | `/api/admin/projects/[projectId]` | Proje CRUD |
| GET | `/api/admin/projects/[projectId]/summary` | Finans özeti |
| GET/PUT | `/api/admin/projects/[projectId]/wage-policy` | Maaş politikası |

---

## Yönetici — personel

| Method | Path | Açıklama |
|--------|------|----------|
| GET/POST | `/api/admin/projects/[projectId]/employees` | Liste / ekle |
| GET/PATCH/DELETE | `/api/admin/projects/[projectId]/employees/[employeeId]` | Detay |
| POST | `/api/admin/projects/[projectId]/employees/[employeeId]/reset-pin` | PIN sıfırla |
| GET | `/api/admin/projects/[projectId]/employees/[employeeId]/sensitive` | Hassas veri |
| POST | `/api/admin/projects/[projectId]/employees/[employeeId]/photo` | Fotoğraf |
| POST | `/api/admin/projects/[projectId]/employees/[employeeId]/legal-dossier` | Hukuki dosya |

---

## Yönetici — kayıtlar

| Method | Path | Query params |
|--------|------|--------------|
| GET/POST | `.../work-logs` | `employeeId`, `month`, `approved`, `disputed` |
| PATCH/DELETE | `.../work-logs/[recordId]` | — |
| GET/POST | `.../deductions` | `employeeId`, `month`, `deductionType` |
| PATCH/DELETE | `.../deductions/[recordId]` | — |
| GET/POST | `.../minimum-wages` | `employeeId`, `month` |
| PATCH/DELETE | `.../minimum-wages/[recordId]` | — |

---

## Yönetici — bordro ve politika

| Method | Path | Açıklama |
|--------|------|----------|
| GET/POST | `/api/admin/projects/[projectId]/payroll` | Bordro oku / hesapla |
| GET/PUT | `/api/admin/wage-policy` | Şirket maaş politikası |

---

## Yönetici — başvuru

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/admin/registrations` | Bekleyen başvurular |
| POST | `/api/admin/registrations/[id]/approve` | Onayla |
| POST | `/api/admin/registrations/[id]/reject` | Reddet |
| GET | `/api/admin/registrations/lookup` | Kod ile arama |

---

## Personel

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/personnel/me` | Profil + proje + yönetici |
| GET | `/api/personnel/work-logs` | `?month=` |
| GET | `/api/personnel/work-logs/today` | Bugünkü yoklama |
| POST | `/api/personnel/work-logs/confirm` | Gün onayı |
| POST | `/api/personnel/work-logs/[id]/dispute` | İtiraz |
| GET | `/api/personnel/deductions` | `?month=` |
| GET | `/api/personnel/minimum-wages` | `?month=` |
| GET | `/api/personnel/summary` | `?month=` → RPC istatistik |
| GET | `/api/personnel/asgari` | `?month=` → politika + gap + kayıtlar |
| GET | `/api/personnel/contracts` | Sözleşmeler |
| POST | `/api/personnel/change-password` | Şifre değiştir |
| GET/POST | `/api/personnel/my-dossier` | Hukuki dosya |

### GET /api/personnel/asgari yanıt örneği

```json
{
  "month": "2026-06",
  "hireDate": "2026-06-15",
  "policyConfigured": true,
  "policy": {
    "yevmiyePaymentTriggers": ["month_end"],
    "referenceMonthly": 33030,
    "prorationMode": "calendar_days"
  },
  "earnings": {
    "approvedGross": 12000,
    "approvedDays": 10,
    "minimumPaid": 0
  },
  "gap": {
    "eligibleMinimum": 18110,
    "remainingGap": 6110,
    "isBelowMinimum": true,
    "paymentStatus": "open"
  },
  "records": []
}
```

---

## Public (anonim)

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/api/public/personnel-registration` | Başvuru gönder |
| GET | `/api/public/personnel-registration/status` | Durum sorgula |
| GET | `/api/public/contracts` | Sözleşme listesi |
| GET | `/api/public/contracts/view` | Sözleşme metni |
| POST | `/api/public/contract-otp/send` | OTP gönder |
| POST | `/api/public/contract-otp/verify` | OTP doğrula |
| POST | `/api/public/contract-otp/prepare` | OTP hazırlık |
| POST | `/api/public/contract-otp/confirm-link` | Onay linki |

---

## Developer

| Method | Path | Açıklama |
|--------|------|----------|
| GET/POST | `/api/developer/codes` | Doğrulama kodları |
| DELETE | `/api/developer/codes/[codeId]` | Kod sil |
| POST | `/api/developer/wipe-database` | Test verisi temizle (dikkat!) |

---

## Cron

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/cron/personnel-pending-reminders` | `CRON_SECRET` header |

---

## HTTP durum kodları

| Kod | Anlam |
|-----|-------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Oturum geçersiz |
| 403 | Yetkisiz |
| 404 | Bulunamadı |
| 500 | Sunucu hatası |
| 503 | Migration gerekli |

---

## İlgili belgeler

- [Mimari](./03-MIMARI.md)
- [Güvenlik](./06-GUVENLIK-VE-KVKK.md)
