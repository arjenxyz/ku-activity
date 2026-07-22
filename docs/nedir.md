# CrewLedger nedir?

İnşaat / şantiye personelinin **yevmiyesini, mesaisini, avansını** dijital tutan bir uygulama.

## Problem

Sektörde hala:

- kağıt puantaj
- WhatsApp listeleri
- Excel

kullanılıyor. Hata çıkıyor, kim ne gördü belli değil.

## Çözüm

Yönetici ve personel **aynı veriyi** görür. Kritik günler **çift onay** ister.

## Roller

- **Admin** — proje sahibi / şantiye sorumlusu. Sadece kendi projelerini görür.
- **Personel** — saha işçisi. Kendi kayıtları + QR yoklama.
- **Developer** — platform operatörü (APK, sistem araçları).

## Paneller

| Panel | Yol |
|-------|-----|
| Yönetici | `/admin-panel` |
| Personel | `/personnel-panel` |
| Developer | `/developer-panel` |

Canlı site: [crewledger.vercel.app](https://crewledger.vercel.app)
