# 02 — Problem Tanımı ve Çözüm

## Sektörel problem

### 1. Puantaj güvenilirliği

Şantiyede “bugün kaç gün yazıldım?” sorusunun cevabı çoğu zaman yöneticinin defterinde veya Excel’de kalır. Personel:

- Kaydı sonradan göremez
- Düzeltme talebini kanıtlayamaz
- Ay sonunda sürpriz kesintiyle karşılaşabilir

### 2. Dağınık finans kayıtları

Yevmiye, avans, kesinti ve asgari tamamlama farklı kanallarda tutulur:

| Kayıt | Geleneksel yöntem |
|-------|-------------------|
| Yevmiye | Defter / WhatsApp |
| Avans | Elden + hafıza |
| Kesinti | Sözlü / ayrı Excel |
| Asgari fark | Muhasebe sonradan |

Bu parçalı yapı **net maaş uyuşmazlığı** üretir.

### 3. İşe giriş ve KVKK

Kimlik fotokopisi, IBAN, sözleşme imzası çoğu firmada:

- WhatsApp ile paylaşılır
- Tek klasörde saklanır
- Kim ne zaman onayladı izlenmez

### 4. Saha koşulları

İnşaat personeli masa başı bilgisayar kullanmaz. Mobil erişim, basit arayüz ve düşük bant genişliğine tolerans şarttır.

---

## CrewLedger çözümü

### Ortak gerçeklik (single source of truth)

Tüm kayıtlar **Supabase PostgreSQL** üzerinde tutulur. Yönetici paneli ve personel paneli **aynı tabloları** ve **aynı RPC fonksiyonlarını** kullanır. Personel için “gizli kesinti” mimari olarak mümkün değildir — personel kendi avans, kesinti ve yevmiye özetini görür.

### Çift onaylı yoklama

```
Yönetici kayıt girer → Personel onaylar VEYA itiraz eder → İki taraf onaylı → approved = true
```

`approved` bayrağı veritabanı trigger’ı ile korunur; yalnızca arayüz değil **DB seviyesinde** enforced.

### İtiraz döngüsü

Personel itiraz notu bırakır → yönetici düzeltir → kayıt yeniden personel onayına düşer. Admin **itirazlar** sayfasından tüm açık kayıtları yönetir.

### Mesai ayrımı

Mesai kazancı, çalışılan gün sayısına **karıştırılmaz**. Brüt:

```
Brüt = (çalışılan gün × günlük yevmiye) + mesai kazancı
```

### Finans şeffaflığı

```
Net = Brüt − Avanslar − Kesintiler + Asgari tamamlamalar
```

Personel **Finans** ve **Asgari** sekmelerinde dökümü görür.

### Dijital işe alım

QR / doğrulama kodu → form → selfie → sözleşme (scroll + OTP) → admin onayı → PIN ile giriş.

### Maaş politikası (yeni)

Ana yetkili, şirket genelinde:

- Yevmiye ne zaman ödenir (ay sonu / çatı / iş bitimi)
- Asgari referans tutarı
- İşe girişten oranlama

kurallarını tanımlar. Asgari fark hesabı bu politikaya göre yapılır.

---

## Etki metrikleri (hedeflenen)

| Metrik | Önce | Sonra (hedef) |
|--------|------|----------------|
| Puantaj uyuşmazlık süresi | Günler/haftalar | Anlık itiraz + kayıt |
| Personel veri erişimi | Yok / telefonla sor | 7/24 PWA panel |
| Hassas veri paylaşımı | WhatsApp | Şifreli DB + kontrollü API |
| İşe giriş süresi | Kağıt + yüz yüze | Dijital başvuru + uzaktan onay |
| Denetim hazırlığı | Dosya toplama | Tek tık hukuki dosya |

---

## Rakip / alternatif karşılaştırma

| Yaklaşım | Eksik |
|----------|-------|
| Excel | Çift onay yok, mobil zayıf, versiyon karmaşası |
| Genel İK yazılımları | Yevmiye/mesai inşaat modeline uyumsuz |
| WhatsApp grupları | Denetim izi yok, KVKK riski |
| **CrewLedger** | Sektöre özel + çift onay + personel paneli |

---

## Örnek senaryo (40 kişilik şantiye)

1. Yönetici “Veri Merkezi Şantiyesi” projesini oluşturur.
2. Personel QR ile başvurur; sözleşmeleri OTP ile onaylar.
3. Yönetici günlük yevmiye + mesai girer.
4. Personel PWA’dan günleri onaylar.
5. Ay sonunda bordro hesaplanır; asgari fark varsa admin kaydeder.
6. Personel Asgari sekmesinde hak edilen / ödenen / kalan tutarı görür.
7. Uyuşmazlıkta personel itiraz eder; admin düzeltir.

---

## İlgili belgeler

- [İş Kuralları](./09-IS-KURALLARI.md)
- [Personel Paneli](./08-PERSONEL-PANEL.md)
- [Yönetici Paneli](./07-ADMIN-PANEL.md)
