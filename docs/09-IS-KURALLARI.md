# 09 — İş Kuralları ve Formüller

Bu belge CrewLedger’daki **domain logic** kurallarını tanımlar. Kod referansları `src/lib/` altındadır.

---

## 1. Çalışılan gün (yevmiye birimi)

| `amount` değeri | Anlam |
|-----------------|-------|
| `1` | Tam gün |
| `0.5` | Yarım gün |

Günlük yevmiye kazancı:

```
base_pay = work_days × daily_wage
```

`work_days` = onaylı veya tüm kayıtların `amount` toplamı (bağlama göre).

---

## 2. Mesai

Mesai, **çalışılan günden bağımsız** hesaplanır.

| `mesai_type` | Birim (`mesai_units`) | Ek ödeme |
|--------------|----------------------|----------|
| `ceyrek` | 0.25 | günlük yevmiye × 0.25 |
| `yarim` | 0.50 | günlük yevmiye × 0.50 |
| `tam` | 1.00 | günlük yevmiye × 1.00 |
| `none` | 0 | 0 |

```
mesai_pay = Σ (mesai_units × daily_wage)
gross = base_pay + mesai_pay
```

Personel özetinde “çalışılan gün” mesai **içermez**.

---

## 3. Çift onay

Bir `work_log` kaydı `approved = true` olması için:

1. `admin_confirmed_at IS NOT NULL`
2. `employee_confirmed_at IS NOT NULL`
3. `employee_disputed_at IS NULL` (itiraz yok veya çözüldü)

Trigger: `sync_work_log_approved` (migration 018+)

### Onay durumları (UI)

| Durum | Koşul |
|-------|-------|
| `pending_admin` | Personel bildirdi, admin onayı yok |
| `pending_employee` | Admin girdi, personel onayı yok |
| `disputed` | Personel itiraz etti |
| `confirmed` | İki onay tamam |

---

## 4. İtiraz

1. Personel `employee_dispute_note` gönderir
2. `employee_disputed_at` set edilir
3. `approved` false kalır
4. Admin kaydı düzeltir (`resolveDispute` / `reconfirmAdmin`)
5. Dispute alanları temizlenir, personel yeniden onaylar

---

## 5. Avans ve kesinti

`deductions.type` enum:

| Tür | Etki |
|-----|------|
| `advance` | Netten düşülür (avans) |
| `deduction` | Kesinti |
| `subcontractor_cut` | Taşeron kesintisi |
| `other` | Diğer |

```
total_advance = Σ advance
total_deduct = Σ (deduction + subcontractor_cut + other)
```

---

## 6. Asgari ücret tamamlama

### Kavramlar

| Terim | Açıklama |
|-------|----------|
| **Onaylı yevmiye** | Onaylı work_logs brütü (gün + mesai) |
| **Dönem tavanı** | Hak edilen asgari (politikaya göre) |
| **Ödenen asgari** | `minimum_wages` toplamı |
| **Taşeron farkı** | max(0, tavan − yevmiye − ödenen) |

### Formül

```
remaining_gap = max(0, eligible_minimum − approved_gross − minimum_paid)
```

### Oranlama (işe giriş)

Politika `prorationFromHireDate = true` ise:

**Takvim günü modu:**
```
eligible = (monthly_reference / days_in_month) × days_from_hire_to_month_end
```

**Çalışılan gün modu:**
```
eligible = (monthly_reference / days_in_month) × approved_work_days
```

**Tam ay modu:** Oranlama yok.

Varsayılan referans: 33.030 ₺ (2026), `NEXT_PUBLIC_OFFICIAL_MINIMUM_WAGE_GROSS` ile override.

### Net maaşa etkisi

```
net = gross − total_advance − total_deduct + total_minimum
```

Migration `035_minimum_wage_in_net.sql` ve `get_personnel_month_stats` RPC güncel.

---

## 7. Maaş politikası

`wage_policies.policy` JSONB alanları:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `yevmiyePaymentTriggers` | array | `month_end`, `roof_complete`, `job_complete` |
| `officialMonthlyMinimum` | number \| null | Özel asgari referans |
| `prorationFromHireDate` | boolean | Giriş tarihi oranlaması |
| `prorationMode` | enum | `calendar_days`, `worked_days`, `full_month` |

Çözümleme: `resolveWagePolicyForProject()` — proje özel veya şirket varsayılanı.

---

## 8. Bordro

Admin “Bordro Hesapla” dediğinde personel başına:

```
gross = approved_work_days × daily_wage + mesai_units × daily_wage
net = gross − advances − other_deductions + minimum_paid
```

Sonuç `payroll_lines` tablosuna yazılır.

---

## 9. Dijital başvuru

Sıra:

1. Doğrulama kodu / QR
2. Form (ad, iletişim)
3. Hassas veri (şifreli kayıt)
4. Selfie fotoğraf
5. Sözleşme scroll + OTP
6. `pending` durumunda admin onayı
7. Onay → `employees` + PIN

Minimum yaş kontrolü: `age-validation.ts` (inşaat sahası).

---

## 10. Sözleşme onayı

- Metin versiyonlu (`personnel_contracts`)
- Scroll tamamlanmadan onay butonu aktif olmaz
- OTP e-posta doğrulama (`contract-otp` API)
- Onay hash ve timestamp kaydı

---

## 11. Hukuki dosya

Export paketi içeriği (örnek):

- Personel profili
- Yevmiye, avans, kesinti, asgari kayıtları
- Sözleşme onayları
- Fotoğraf (varsa)
- JSON + CSV + ZIP

Modül: `src/lib/legal-dossier/`

---

## İlgili belgeler

- [Veritabanı](./05-VERITABANI.md)
- [Yönetici Paneli](./07-ADMIN-PANEL.md)
- [Personel Paneli](./08-PERSONEL-PANEL.md)
