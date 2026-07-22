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

Üç yol, hepsi çalışır:

1. **Otomatik** — yoklama sayfasından aç/kapat; her gün 21:00
2. **QR** — usta başlatır, personel okutur (aktif QR varken otomatik dokunmaz)
3. **Manuel** — aynı sayfada “Manuel yevmiye ekle”

Personel “Bugün işe çıkmadım” derse otomatikte yevmiye yazılmaz.  
Yanlış eklenen → tamamlanmış listeden çıkarılır.

Cron: `/api/cron/auto-attendance` (Bearer `CRON_SECRET`, her 15 dk)

## Bildirimler

- Uygulama içi: `personnel_notifications` tablosu
- Telefon push: aktif oturumlu cihazlara (web push)
- Mail / SMS yok
