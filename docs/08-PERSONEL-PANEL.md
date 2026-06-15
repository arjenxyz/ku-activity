# 08 — Personel Paneli

**Base URL:** `/personnel-panel`

Mobil öncelikli, PWA destekli self-servis panel. Personel yalnızca **kendi** kayıtlarını görür ve onaylar.

---

## Giriş ve başvuru

| Sayfa | URL |
|-------|-----|
| Giriş | `/personnel-panel/login` |
| Başvuru | `/personnel-panel/basvuru` |
| Başvuru durumu | `/personnel-panel/basvuru/dogrula` |

Giriş: e-posta + PIN veya T.C. kimlik + PIN (proje yapılandırmasına bağlı).

---

## Sekme yapısı

URL parametresi: `?tab={id}`

| Sekme | ID | İçerik |
|-------|-----|--------|
| **Özet** | `overview` | Finans kartları, çalışılan gün / mesai şeritleri, onay bekleyenler |
| **Yevmiye** | `work` | Aylık takvim, kayıt listesi, onay/itiraz |
| **Mesai** | `mesai` | Mesai takvimi (TL), tür bazlı özet |
| **Asgari** | `asgari` | Hak edilen / ödenen / kalan, politika, ödeme listesi |
| **Finans** | `finance` | Maaş dökümü, avans, kesinti, yazdır |
| **Haklarım** | `rights` | KVKK, hukuki dosya |
| **Ayarlar** | `settings` | Proje, sözleşme, şifre, görünüm |

Mobil alt menüde 7 sekme; masaüstünde üst tab navigasyonu.

---

## Asgari sekmesi (detaylı)

**Bileşen:** `PersonnelAsgariPanel`  
**API:** `GET /api/personnel/asgari?month=YYYY-MM`

### Ekran bölümleri

1. **Ay filtresi** — dönem seçimi
2. **Durum kartı** — Tamamlandı / Kısmen ödendi / Bekleyen tamamlama
3. **İlerleme çubuğu** — yevmiye + ödenen asgari / dönem tavanı
4. **4 özet kart** — onaylı yevmiye, hak edilen, ödenen, kalan
5. **Hesaplama dökümü** — satır satır formül
6. **Ödeme zamanı** — işveren politikasından (ay sonu / çatı / iş bitimi)
7. **Ödeme kayıtları** — tarih, tutar, açıklama
8. **SSS** — açılır bilgi kutusu

### Rozet

Bekleyen veya kısmi asgari tamamlama varsa sekmede **kırmızı rozet (1)** gösterilir.

### Politika uyarısı

Şirket maaş politikası tanımlı değilse sarı uyarı: varsayılan kurallar kullanılıyor.

---

## Özet sekmesi

- 4 finans kartı: Brüt, Avans, Kesinti, Net
- Çalışılan gün şeridi → Yevmiye sekmesine link
- Mesai şeridi → Mesai sekmesine link
- Onay bekleyen yevmiye kutusu
- Güven + WhatsApp footer (yönetici telefonu)

**Not:** Yönetici zaten kayıt girdiyse (`pending_employee` / `disputed`) günlük yoklama kutusu gizlenir — çift UI önlenir.

---

## Yevmiye sekmesi

- `PersonnelCalendar` — gün bazlı onay durumu renkleri
- Kayıt listesi — `PersonnelWorkLogItem` ile onay / itiraz
- İtiraz notu zorunlu

---

## Mesai sekmesi

- Mesai takvimi — günlük TL kazancı
- Tür bazlı özet: çeyrek, yarım, tam
- Mesai, çalışılan gün sayısına **dahil edilmez**

---

## Finans sekmesi

- Gradient net maaş kartı
- Maaş dökümü tablosu
- Avans ve kesinti listeleri
- **“Asgari ücret detayı →”** butonu (Asgari sekmesine yönlendirir)
- Yazdır (print CSS)

---

## PWA özellikleri

| Özellik | Açıklama |
|---------|----------|
| `manifest.webmanifest` | Kurulum meta verisi |
| Service Worker | Önbellek stratejisi |
| Install banner | Ana ekrana ekle teşviki |
| Pull-to-refresh | Veri yenileme |

---

## UX kararları

| Karar | Gerekçe |
|-------|---------|
| Aynı RPC ile istatistik | Admin ile tutarlı rakamlar |
| Lazy finance load | Özet dışı sekmelerde gereksiz API yok |
| Tab URL sync | Paylaşılabilir deep link |
| Dark mode desteği | Personel tercihi (display settings) |

---

## İlgili belgeler

- [İş Kuralları](./09-IS-KURALLARI.md)
- [API — personnel/asgari](./10-API-REFERANSI.md)
