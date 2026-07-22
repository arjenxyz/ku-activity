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

## Bildirimler

- Uygulama içi: `personnel_notifications` tablosu
- Telefon push: aktif oturumlu cihazlara (web push)
- Mail / SMS yok
