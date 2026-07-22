# Kod haritası

AI / vibe coding ile dokunurken buraya bak.

## UI

| Klasör | Ne |
|--------|----|
| `src/app/admin-panel/` | Yönetici ekranları |
| `src/app/personnel-panel/` | Personel ekranları |
| `src/app/developer-panel/` | Developer araçları |
| `src/components/` | Paylaşılan UI parçaları |

## API

`src/app/api/` → Next.js route handler’lar

Örnekler:

- `api/auth/...` — giriş / çıkış
- `api/personnel/...` — personel oturumu
- `api/admin/...` — yönetici işlemleri

## İş mantığı

`src/lib/` — asıl kurallar burada.

Önemli dosyalar:

| Dosya | Konu |
|-------|------|
| `personnel-auth.ts` | Personel oturumu |
| `personnel-notification-service.ts` | Bildirim yazma |
| `personnel-push-service.ts` | Web push gönderme |
| `attendance-qr-service.ts` | QR yoklama |
| `field-encryption.ts` | T.C. / IBAN şifreleme |

## Veritabanı

`supabase/migrations/` — şema değişiklikleri  
Yeni tablo / kolon → yeni migration dosyası ekle, numarayı arttır.

## Android

| Klasör | Ne |
|--------|----|
| `twa/` | TWA notları |
| `twa-build/` | Bubblewrap çıktısı |
| `scripts/` | APK build / upload scriptleri |

## Diğer

| Dosya | Ne |
|-------|----|
| `public/sw.js` | Service worker (push + cache) |
| `json/` | UI metinleri (TR/EN) |
| `.env.example` | Env şablonu |
