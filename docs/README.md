# CrewLedger — Dokümantasyon Merkezi

**CrewLedger** ([crewledger.vercel.app](https://crewledger.vercel.app)), inşaat ve şantiye ortamlarında personel puantajı, mesai, finans ve işe alım süreçlerini dijitalleştiren full-stack bir web platformudur.

Bu klasör, **GitHub** ve **teknik değerlendirme** için hazırlanmış resmi dokümantasyon setidir.

---

## Hedef kitle

| Okuyucu | Önerilen belgeler |
|---------|-------------------|
| Ürün / iş ortağı | [Genel Bakış](./01-GENEL-BAKIS.md), [Problem ve Çözüm](./02-PROBLEM-VE-COZUM.md), [Proje Tanıtımı](./CREWLEDGER_PROFESOR_TANITIM.md) |
| Yazılım geliştirici | [Teknoloji Yığını](./04-TEKNOLOJI-YIGINI.md), [Veritabanı](./05-VERITABANI.md), [API Referansı](./10-API-REFERANSI.md), [Kurulum](./11-KURULUM-VE-DEPLOY.md) |
| Güvenlik / KVKK denetçisi | [Güvenlik ve KVKK](./06-GUVENLIK-VE-KVKK.md), [Hukuki Dosya](./09-IS-KURALLARI.md#hukuki-dosya) |

---

## Belge indeksi

| # | Belge | İçerik |
|---|--------|--------|
| 01 | [Genel Bakış](./01-GENEL-BAKIS.md) | Vizyon, kapsam, roller, proje özeti |
| 02 | [Problem ve Çözüm](./02-PROBLEM-VE-COZUM.md) | Sektörel sorunlar, CrewLedger yaklaşımı, etki |
| 03 | [Mimari](./03-MIMARI.md) | Sistem diyagramı, katmanlar, veri akışı |
| 04 | [Teknoloji Yığını](./04-TEKNOLOJI-YIGINI.md) | Framework, kütüphaneler, altyapı |
| 05 | [Veritabanı](./05-VERITABANI.md) | Tablolar, migration, RPC, RLS |
| 06 | [Güvenlik ve KVKK](./06-GUVENLIK-VE-KVKK.md) | Şifreleme, oturum, uyumluluk |
| 07 | [Yönetici Paneli](./07-ADMIN-PANEL.md) | Admin özellikleri, menüler, iş akışları |
| 08 | [Personel Paneli](./08-PERSONEL-PANEL.md) | PWA, sekmeler, mobil UX |
| 09 | [İş Kuralları](./09-IS-KURALLARI.md) | Çift onay, mesai, asgari, bordro formülleri |
| 10 | [API Referansı](./10-API-REFERANSI.md) | REST uç noktaları özeti |
| 11 | [Kurulum ve Deploy](./11-KURULUM-VE-DEPLOY.md) | Yerel geliştirme, env, Supabase, Vercel |
| — | [Proje Tanıtımı](./CREWLEDGER_PROFESOR_TANITIM.md) | Ürün ve özellik özeti |

---

## Hızlı erişim

| Bileşen | URL |
|---------|-----|
| Ana site | `/` |
| Yönetici giriş | `/admin-panel/login` |
| Personel giriş | `/personnel-panel/login` |
| Personel başvuru | `/personnel-panel/basvuru` |
| Şirket maaş politikası | `/admin-panel/maas-politikasi` |
| Geliştirici panel | `/developer-panel/login` |

---

## Sürüm bilgisi

| Alan | Değer |
|------|--------|
| Uygulama | CrewLedger v0.1.0 |
| Dokümantasyon | Haziran 2026 |
| Migration sayısı | 40 (001–036 + alt dosyalar) |
| Ana dil (UI) | Türkçe |
| Lisans | Proje sahibi |

---

## Katkı ve güncelleme

Dokümantasyon, kod tabanıyla birlikte güncellenir. Yeni özellik eklendiğinde ilgili belge ve bu indeks güncellenmelidir.

**Son önemli eklemeler (2026):**
- Maaş politikası modülü (`wage_policies`, migration 036)
- Asgari ücret: admin hesaplama + personel **Asgari** sekmesi
- Net maaş formülüne asgari tamamlama dahil edildi (migration 035)

---

*CrewLedger — İnşaat Personel Yönetimi · [crewledger.vercel.app](https://crewledger.vercel.app)*
