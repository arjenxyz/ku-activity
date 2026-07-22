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

## Yoklama (QR)

1. Admin oturum açar, QR gösterir
2. Personel kamerayla okutur
3. Listeye düşer
4. Oturum bitince yevmiye yazılır

### Otomatik yoklama (opsiyonel)

Proje ayarlarından açılır. Her gün **21:00** (proje saat dilimi, genelde TR) aktif personele yoklama alınır.

- Personel “Bugün işe çıkmadım” derse → yevmiye **yazılmaz**
- Yanlış eklenen kişi → tamamlanmış listeden çıkarılır → **işe çıkmadı** işaretlenir

Cron: `/api/cron/auto-attendance` (Bearer `CRON_SECRET`, her 15 dk önerilir)

## Bildirimler

- Uygulama içi: `personnel_notifications` tablosu
- Telefon push: aktif oturumlu cihazlara (web push)
- Mail / SMS yok
