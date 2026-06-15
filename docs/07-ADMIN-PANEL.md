# 07 — Yönetici Paneli

**Base URL:** `/admin-panel`

Yönetici paneli, şantiye (proje) bazlı personel ve finans yönetimi sağlar. Her yönetici yalnızca **kendi oluşturduğu projelere** erişir.

---

## Giriş ve kayıt

| Sayfa | URL |
|-------|-----|
| Giriş | `/admin-panel/login` |
| Kayıt | `/admin-panel/register` |
| Proje listesi | `/admin-panel` |

Kayıt sonrası Supabase Auth ile `profiles` kaydı oluşur (`role: admin`).

---

## Global ayarlar

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Maaş Politikası | `/admin-panel/maas-politikasi` | Şirket geneli asgari ve yevmiye kuralları |

Üst menüden **Maaş Politikası** linki ile erişilir.

---

## Proje menü yapısı

Her proje: `/admin-panel/proje/[projectId]/...`

### Personel Yönetimi

| Menü | URL | İşlev |
|------|-----|-------|
| Proje Özeti | `/` | İstatistikler, kısa durum |
| Yeni Personel | `/new` | Manuel personel ekleme |
| Başvuru Onayı | `/basvuru-onay` | Dijital başvuruları onayla/reddet |
| Personel Listesi | `/list` | Tüm personel |
| Avans Ekle | `/avans` | Avans kaydı |
| Kesinti Ekle | `/kesinti` | Kesinti türü seçimli kayıt |
| Yevmiye Ekle | `/yevmiye` | Puantaj + mesai |
| Asgari Ekle | `/asgari` | Asgari tamamlama + taşeron farkı önerisi |

### Sorgulama

| Menü | URL |
|------|-----|
| Personel Sorgulaması | `/sorgulama` |
| Admin Sorgulama | `/sorgulama/admin` |
| Personel Şifreleri | `/sorgulama/personel-sifreleri` |
| Avans / Kesinti / Yevmiye / Asgari | `/sorgulama/{tür}` |

Kayıtlar düzenlenebilir ve silinebilir (`RecordEditActions`).

### Raporlar

| Menü | URL |
|------|-----|
| Admin Raporları | `/raporlar` |
| Günlük Onaylananlar | `/raporlar/onaylanan` |
| Onaylanmayanlar | `/raporlar/onaysiz` |
| Personel İtirazları | `/itirazlar` |

### Finans

| Menü | URL |
|------|-----|
| Ne durumdayız? | `/durum` |
| Maaş Bordroları | `/bordro` |
| Maaş Politikası (proje) | `/maas-politikasi` |

---

## Asgari Ekle sayfası (gelişmiş)

`/proje/[id]/asgari` özellikleri:

1. Ay + personel seçimi
2. Onaylı yevmiye brütü otomatik hesap
3. **Hak edilen asgari** (politika + işe giriş oranlaması)
4. **Taşeron farkı** önerisi
5. “Önerilen tutarı forma yaz” butonu
6. Dönem asgari kayıt listesi

Politika doldurulmamışsa uyarı gösterilir.

---

## Maaş politikası formu

Ana yetkili şunları tanımlar:

| Alan | Seçenekler |
|------|------------|
| Yevmiye ödeme zamanı | Ay sonu, çatı bitince, iş bitimi (çoklu) |
| Aylık asgari referans | Boş = devlet varsayılanı (2026: 33.030 ₺) |
| İşe giriş oranlaması | Takvim günü / çalışılan gün / tam ay |
| Dekont modu | Hazırlık (henüz aktif değil) |

Proje sayfasından “şirket varsayılanını kullan” veya özel kural seçilebilir.

---

## Personel detay

`/list/[employeeId]`:

- Kişisel bilgi düzenleme
- Fotoğraf yükleme
- PIN sıfırlama
- Hassas veri görüntüleme (şifre çözülmüş, yetkili admin)
- Hukuki dosya export

---

## Bordro

1. Ay seç
2. “Bordro Hesapla” — tüm aktif personel için satır üretir
3. Brüt, avans, kesinti, asgari, net kolonları
4. `payroll_periods` + `payroll_lines` tablolarına yazar

---

## İtiraz yönetimi

`/itirazlar`:

- `employee_disputed_at` dolu kayıtlar
- Admin düzeltme + yeniden onay gönderme
- Dispute alanlarını temizleme

---

## İlgili belgeler

- [İş Kuralları](./09-IS-KURALLARI.md)
- [API Referansı](./10-API-REFERANSI.md)
