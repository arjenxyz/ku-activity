# CrewLedger — İnşaat Saha Personel Yönetim Platformu

**Proje tanıtım belgesi**  
*Profesör sunumu ve akademik değerlendirme için hazırlanmıştır.*

---

## 1. Özet

**CrewLedger** (crewledger.app), inşaat ve şantiye ortamlarında çalışan personelin **puantaj (yevmiye)**, **mesai**, **avans**, **kesinti**, **bordro** ve **sözleşme** süreçlerini dijitalleştiren, web tabanlı bir **iş gücü yönetim platformudur**.

Geleneksel yöntemlerde puantaj defterleri, WhatsApp mesajları ve Excel tablolarıyla yürütülen süreçler; hata riski, şeffaflık eksikliği ve personel–yönetici arasında güven sorunları doğurur. CrewLedger bu sorunu **çift onaylı yoklama**, **ortak veri kaynağı** (yönetici ve personel aynı veritabanını görür) ve **mobil öncelikli personel paneli** ile çözmeyi hedefler.

Platform üç ana kullanıcı rolüne hizmet eder:

| Rol | Açıklama |
|-----|----------|
| **Yönetici (Admin)** | Proje/şantiye bazında personel, puantaj, finans ve raporlama |
| **Personel** | Kendi çalışma günlerini, mesaisini, maaş özetini görme ve onaylama |
| **Geliştirici (Developer)** | Platform doğrulama kodları, sistem yönetimi |

---

## 2. Problem Tanımı ve Motivasyon

İnşaat sektöründe personel ödemeleri çoğunlukla **günlük yevmiye** üzerinden hesaplanır. Saha koşullarında:

- Puantaj kayıtları gecikebilir veya kaybolabilir.
- Personel, kendisine yazılan gün sayısını ve kesintileri **doğrulayamaz**.
- Avans, kesinti ve mesai hesapları farklı kanallarda tutulduğu için **uyuşmazlık** çıkar.
- KVKK kapsamındaki kimlik, IBAN gibi veriler güvensiz ortamlarda paylaşılabilir.
- İşe giriş süreci (sözleşme, kimlik, fotoğraf) kağıt ve manuel onaylarla yavaşlar.

CrewLedger, bu süreçleri **tek platformda**, **denetlenebilir** ve **çift taraflı onaylı** bir modele taşır.

---

## 3. Temel İş Süreçleri

### 3.1 Çift Onaylı Yoklama (Dual Approval)

Sistemin en kritik iş kuralıdır. Bir çalışma gününün **kesinleşmesi** için hem yönetici hem personel onayı gerekir:

```
Yönetici yevmiye girer  →  Personel onaylar veya itiraz eder  →  Gün "Onaylı" olur
        ↓                              ↓
   admin_confirmed_at            employee_confirmed_at
```

- Yönetici puantaj girebilir; personel **onaylamadan** gün maaşa dahil edilmez.
- Personel “bugün çalıştım” bildirimi yapabilir; yönetici onayı bekler.
- **İtiraz** mekanizması: Personel kayda itiraz ederse yönetici düzeltir ve kayıt yeniden personel onayına düşer.
- Veritabanı tetikleyicisi (`sync_work_log_approved`): Her iki onay timestamp’i dolmadan `approved = true` olmaz.

Bu model, tek taraflı manipülasyonu **mimari düzeyde** engeller.

### 3.2 Mesai Yönetimi

Mesai, çalışılan günden **ayrı** hesaplanır:

| Mesai türü | Ek ücret birimi |
|------------|-----------------|
| Çeyrek mesai | Günlük yevmiyenin %25’i |
| Yarım mesai | %50 |
| Tam mesai | %100 (tam günlük yevmiye ek) |

- **Brüt kazanç** = (çalışılan gün × günlük yevmiye) + mesai kazancı  
- Personel panelinde mesai **ayrı sekme** ve **takvim + TL kazancı** olarak gösterilir.

### 3.3 Finans: Avans, Kesinti, Asgari Ücret, Bordro

| Kayıt türü | Açıklama |
|-------------|----------|
| **Yevmiye** | Tam/yarım gün çalışma + isteğe bağlı mesai |
| **Avans** | Personele verilen ön ödeme |
| **Kesinti** | Maaştan düşülen tutar (taşeron kesintisi, diğer) |
| **Asgari ücret** | Asgari ücret tamamlama ödemeleri |

Aylık **net maaş** hesabı:

```
Net = Brüt (yevmiye + mesai) − Avanslar − Kesintiler
```

Yönetici **bordro** modülü ile dönemsel maaş özetlerini oluşturabilir; personel kendi panelinde aynı verileri görür.

### 3.4 Personel Başvuru ve Onay (Self-Service Registration)

Yeni personel, **QR kod / doğrulama kodu** ile başvuru yapar:

1. Kişisel bilgiler (ad, e-posta, telefon)
2. **T.C. kimlik**, doğum tarihi, IBAN — uygulama katmanında **AES-256-GCM şifreleme**
3. Selfie / fotoğraf
4. **Sözleşme okuma ve onay** (scroll zorunluluğu, OTP ile e-posta doğrulama)
5. Yönetici **başvuru onay** ekranından inceler ve onaylar/reddeder

Onay sonrası personele PIN/şifre ile giriş hakkı tanınır.

### 3.5 Sözleşme Yönetimi

- Sözleşmeler versiyonlu saklanır.
- Personel sözleşmeyi okuyup onaylamadan işe alım tamamlanmaz.
- OTP ile e-posta doğrulama entegrasyonu mevcuttur.
- Onay kayıtları denetim izi (audit trail) oluşturur.

### 3.6 Hukuki Dosya (Legal Dossier)

Personel veya yönetici, bir çalışanın tüm kayıtlarını (yevmiye, avans, kesinti, sözleşmeler, fotoğraf) **ZIP/CSV/JSON** paketi olarak dışa aktarabilir. Bu özellik uyuşmazlık ve denetim senaryoları için tasarlanmıştır.

---

## 4. Kullanıcı Arayüzleri

### 4.1 Yönetici Paneli (`/admin-panel`)

Proje (şantiye) bazlı çalışır. Her proje için:

**Personel yönetimi**
- Proje özeti, yeni personel ekleme
- Başvuru onayı (pending registrations)
- Personel listesi ve detay (fotoğraf, hassas veriler, PIN sıfırlama)
- Avans, kesinti, yevmiye, asgari ücret girişi

**Sorgulama**
- Personel / admin sorgulama
- Yevmiye, avans, kesinti, asgari kayıt listeleri
- Düzenleme ve silme

**Raporlar**
- Onaylanan / onaylanmayan yevmiyeler
- **Personel itirazları** — açık itirazları görüntüleme, düzeltme, yeniden gönderme

**Finans**
- Proje durumu özeti
- Maaş bordroları

**Proje izolasyonu:** Her yönetici yalnızca kendi oluşturduğu projelere erişir (`030_admin_project_isolation`).

### 4.2 Personel Paneli (`/personnel-panel`)

Mobil öncelikli, PWA olarak telefona kurulabilir:

| Sekme | İçerik |
|-------|--------|
| **Özet** | Brüt/avans/kesinti/net, çalışılan gün ve mesai şeritleri, onay bekleyen kayıtlar, güven notu |
| **Yevmiye** | Aylık puantaj takvimi, kayıt listesi, onay/itiraz |
| **Mesai** | Mesai takvimi (TL kazancı), tür bazında özet |
| **Finans** | Maaş dökümü, avans/kesinti/asgari listeleri |
| **Haklarım** | KVKK bilgilendirme, hukuki dosya indirme |
| **Ayarlar** | Proje bilgisi, sözleşmeler, şifre, görünüm tercihleri |

**Önemli UX kararları:**
- Yönetici kaydı varken çift yoklama kutusu gösterilmez (yalnızca onay kutusu).
- Personel ve yönetici **aynı RPC/veritabanı** üzerinden istatistik görür.
- WhatsApp ile yöneticiye ulaşma butonu (proje sahibi telefonu).

### 4.3 Geliştirici Paneli (`/developer-panel`)

- Proje doğrulama kodu üretimi
- Platform düzeyinde yönetim (owner/developer rolleri)

### 4.4 Kamu Web Sitesi (`/`)

- Tanıtım sayfası (hero, özellikler, nasıl çalışır)
- Yönetici kayıt / giriş yönlendirmesi
- PWA manifest ve kurulum desteği

---

## 5. Teknik Mimari

### 5.1 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes (serverless) |
| **Veritabanı** | Supabase (PostgreSQL) |
| **Kimlik doğrulama** | Supabase Auth (yönetici), özel JWT oturumu (personel PIN/e-posta) |
| **Depolama** | Supabase Storage (personel fotoğrafları, private bucket) |
| **Dağıtım** | Vercel |
| **PWA** | Service Worker, manifest, offline-safe oturum stratejisi |

### 5.2 Veritabanı Tasarımı

38 adet SQL migration ile evrimsel şema yönetimi. Başlıca tablolar:

- `projects` — şantiye/projeler
- `employees` — personel kayıtları
- `work_logs` — yevmiye + çift onay + mesai + itiraz alanları
- `deductions` — avans ve kesintiler
- `minimum_wages` — asgari ücret kayıtları
- `payroll_periods` / `payroll_lines` — bordro
- `employee_registration_requests` — başvurular
- `employee_sensitive_data` — şifreli T.C./IBAN
- `personnel_contracts` / `contract_acceptances` — sözleşmeler
- `legal_dossier_exports` — dışa aktarma logları
- `profiles` — yönetici profilleri (rol: admin, developer, owner)

**Row Level Security (RLS):** Hassas tablolara istemciden doğrudan erişim kapalı; API katmanı `service_role` ile kontrollü erişim sağlar.

### 5.3 Güvenlik Önlemleri

| Konu | Uygulama |
|------|----------|
| **Hassas veri şifreleme** | T.C., doğum tarihi, IBAN — AES-256-GCM (`FIELD_ENCRYPTION_KEY`) |
| **Arama hash’leri** | T.C. ve telefon için HMAC tabanlı lookup (düz metin indekslenmez) |
| **Çift onay** | DB trigger ile `approved` bayrağı yalnızca iki onay sonrası true |
| **Proje izolasyonu** | Yönetici yalnızca kendi projelerine erişir |
| **Oturum** | HttpOnly cookie, middleware ile route koruması |
| **Rate limiting** | Upstash Redis ile API koruması (kritik uçlar) |
| **Fotoğraf** | Private storage, imzalı URL ile erişim |

### 5.4 API Mimarisi

RESTful API route’ları rol bazlı ayrılmıştır:

- `/api/admin/*` — yönetici işlemleri
- `/api/personnel/*` — personel paneli
- `/api/public/*` — başvuru, sözleşme görüntüleme
- `/api/auth/*` — giriş/çıkış
- `/api/developer/*` — platform yönetimi

İş mantığı `src/lib/` altında servis modülleri olarak ayrıştırılmıştır (ör. `work-log-service`, `registration-service`, `personnel-stats`).

---

## 6. Öne Çikan Özellikler (Farklılaştırıcılar)

1. **Çift onay zorunluluğu** — Sadece UI değil, veritabanı seviyesinde enforced.
2. **Personel şeffaflığı** — Personel, yöneticinin gördüğü veriyi kendi panelinde görür; “gizli kesinti” mimari olarak mümkün değildir.
3. **İtiraz döngüsü** — Personel itiraz → yönetici düzeltme → yeniden onay akışı uçtan uca.
4. **Mesai ayrımı** — Çalışılan gün ve mesai kazancı ayrı izlenir; hatalı gün sayımı önlenir.
5. **Dijital işe alım** — QR, sözleşme OTP, selfie, admin onay — kağıtsız onboarding.
6. **PWA** — Şantiyede mobil tarayıcı/PWA ile personel erişimi; uygulama mağazası gerekmez.
7. **Hukuki dosya export** — Denetim ve arşiv için tek tıkla paket.
8. **Multi-tenant proje yapısı** — Bir yönetici birden fazla şantiyeyi izole şekilde yönetir.

---

## 7. Örnek Kullanım Senaryosu

**Senaryo:** “Veri Merkezi” şantiyesinde 40 personel çalışmaktadır.

1. Yönetici Supabase üzerinden proje oluşturur, doğrulama kodu alır.
2. Personel QR ile başvurur, sözleşmeleri onaylar; yönetici başvuruyu onaylar.
3. Her gün yönetici yevmiye girer (tam gün + isteğe bağlı mesai).
4. Personel telefonundan PWA’yı açar, “Onayınızı bekleyen kayıtlar” kutusundan günleri onaylar.
5. Ay sonunda yönetici bordro oluşturur; personel Finans sekmesinden net maaşını görür.
6. Uyuşmazlık olursa personel itiraz eder; yönetici itirazlar sayfasından düzeltir.

---

## 8. Proje Durumu ve Dağıtım

- **Durum:** Aktif geliştirme; production deploy (Vercel + Supabase).
- **Kaynak kod:** Git versiyon kontrolü, migration tabanlı veritabanı evrimi.
- **Dil:** Arayüz Türkçe; kod ve teknik dokümantasyon İngilizce/Türkçe karışık.

---

## 9. Akademik Değerlendirme Açısından Katkılar

CrewLedger aşağıdaki alanlarda **uygulamalı bir vaka çalışması** sunar:

| Alan | Katkı |
|------|--------|
| **Yazılım mühendisliği** | Full-stack Next.js, API tasarımı, migration yönetimi |
| **Veritabanı sistemleri** | RLS, trigger tabanlı iş kuralları, RPC fonksiyonları |
| **Bilgi güvenliği** | Alan düzeyi şifreleme, hash-based lookup, rol izolasyonu |
| **İnsan–bilgisayar etkileşimi** | Mobil-first personel UX, PWA, çift onay akış tasarımı |
| **İş süreçleri otomasyonu** | İnşaat sektörüne özgü puantaj/mesai/bordro modeli |
| **Hukuk / uyumluluk** | KVKK odaklı veri minimizasyonu, sözleşme onay izi, dossier export |

---

## 10. Gelecek Geliştirmeler (Yol Haritası)

- Push bildirimleri (onay bekleyen kayıtlar için)
- Çoklu dil desteği
- Gelişmiş analitik dashboard (proje bazlı trend grafikleri)
- Offline-first senkronizasyon (saha bağlantı kesintileri için)
- e-İmza / e-Belge entegrasyonları

---

## 11. Sonuç

CrewLedger, inşaat sektöründeki **personel ödeme ve puantaj** süreçlerini dijitalleştiren, **çift onay** ve **şeffaflık** ilkelerine dayanan modern bir web platformudur. Yönetici verimliliğini artırırken personelin kendi verilerini doğrulamasına olanak tanır; hassas verileri şifreler ve denetlenebilir kayıt tutar.

Proje; full-stack web geliştirme, güvenli veri yönetimi ve sektöre özgü iş kurallarının yazılıma aktarılması açısından kapsamlı bir **bitirme / araştırma / demo** projesi niteliği taşır.

---

## Ek: Hızlı Erişim

| Bileşen | URL yolu |
|---------|----------|
| Ana site | `/` |
| Yönetici giriş | `/admin-panel/login` |
| Personel giriş | `/personnel-panel/login` |
| Personel başvuru | `/personnel-panel/basvuru` |
| Geliştirici panel | `/developer-panel` |

---

*Belge sürümü: Haziran 2026 — CrewLedger v0.1*
