# İş kuralları

Kısa özet — formül detayı kodda.

## Çift onay

Bir `work_log` (çalışma günü):

1. Yönetici girer / onaylar
2. Personel onaylar

İkisi olmadan gün **kesin** sayılmaz. Bu DB trigger ile zorunlu.

## Mesai

Mesai, normal yevmiyeden **ayrı** kazançtır.  
“Gün çalıştı” ile “mesai yaptı” karışmaz.

## Asgari ücret

Aylık net, yasal asgariye tamamlanabilir.  
Politika admin panelinden (`wage_policies`).

## Avans / kesinti

- Avans: personel ister → admin onaylar / öder
- Kesinti: admin ekler → personel bildiriminde görünür

## Yoklama

Üç yol, hepsi çalışır — **aynı kişiye aynı gün çift yevmiye yazılmaz**:

1. **Otomatik** — yoklama sayfasından aç/kapat; her gün 21:00
2. **QR** — usta başlatır, personel okutur
3. **Manuel** — aynı sayfada “Manuel yevmiye ekle”

### Çakışma kuralları (kilit)

| Durum | Ne olur |
|--------|---------|
| Gün `completed` | QR yeniden açılamaz; otomatik atlanır |
| Aktif QR varken 21:00 | Otomatik yeni liste uydurmaz; listedekileri bitirir |
| DB | `work_logs` → `UNIQUE (employee_id, date)` — ikinci satır imkânsız |
| Manuel + mevcut onaylı | 409; yönetici onaylarsa üzerine yazar |
| Gelmeyen (usta) | Listeden “Gelmedi” / “Çıkar” → yevmiye yok veya silinir |

Gelmeyenleri personel değil usta/yönetici listeden çıkarır.  
Yanlış eklenen → tamamlanmış listeden “Gelmedi” ile düzeltilir.

Cron: `/api/cron/auto-attendance` (Bearer `CRON_SECRET`, her 15 dk)

## Proje kapanış silme

Kapanış süresi (`closure_deadline_at`) dolunca proje + personel + ilişkili kayıtlar silinir.

- Cron: `/api/cron/project-closure-purge` (Bearer `CRON_SECRET`, saatte 1 önerilir)
- Ayrıca personel oturumu / admin kapanış durumu isteklerinde süre dolmuşsa lazy silme çalışır
- Admin proje listesi açılınca `POST /api/admin/projects/purge-expired` arka planda çalışır
- Hızlandırılmış personel silmeleri de aynı cron’da işlenir

## Bildirimler

- Uygulama içi: `personnel_notifications` tablosu
- Telefon push: aktif oturumlu cihazlara (web push)
- Mail / SMS yok
