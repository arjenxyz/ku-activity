# CrewLedger

**İnşaat Personel Yönetim Platformu** — puantaj, mesai, finans, asgari ücret ve dijital işe alım.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

🌐 **https://crewledger.vercel.app**

---

## Nedir?

CrewLedger, şantiye ve taşeron firmalarının personel yevmiyesini, mesaisini, avans/kesintilerini ve asgari ücret tamamlamasını **tek platformda** yönetmesini sağlar. Personel, mobil PWA üzerinden kendi kayıtlarını görür ve **çift onay** ile puantajı doğrular.

### Temel özellikler

- ✅ **Çift onaylı yoklama** — veritabanı trigger ile zorunlu
- ✅ **Personel şeffaflığı** — yönetici ile aynı veri kaynağı
- ✅ **Mesai ayrımı** — çalışılan günden bağımsız kazanç
- ✅ **Asgari ücret modülü** — politika + taşeron farkı + personel sekmesi
- ✅ **Dijital işe alım** — QR, OTP sözleşme, selfie
- ✅ **KVKK odaklı** — T.C./IBAN şifreleme (AES-256-GCM)
- ✅ **PWA** — telefona kurulabilir personel uygulaması
- ✅ **Hukuki dosya** — denetim için ZIP/CSV export

---

## Paneller

| Panel | URL | Kullanıcı |
|-------|-----|-----------|
| Ana site | `/` | Tanıtım |
| Yönetici | `/admin-panel` | Şantiye sorumlusu |
| Personel | `/personnel-panel` | Saha işçisi |
| Geliştirici | `/developer-panel` | Platform operatörü |

---

## Dokümantasyon

**Tüm teknik belgeler `docs/` klasöründedir.**

| Belge | İçerik |
|-------|--------|
| [**docs/README.md**](./docs/README.md) | Dokümantasyon indeksi |
| [Genel Bakış](./docs/01-GENEL-BAKIS.md) | Vizyon ve kapsam |
| [Problem ve Çözüm](./docs/02-PROBLEM-VE-COZUM.md) | Sektörel analiz |
| [Mimari](./docs/03-MIMARI.md) | Sistem tasarımı |
| [Teknoloji Yığını](./docs/04-TEKNOLOJI-YIGINI.md) | Stack detayı |
| [Veritabanı](./docs/05-VERITABANI.md) | Şema ve migration |
| [Güvenlik ve KVKK](./docs/06-GUVENLIK-VE-KVKK.md) | Şifreleme, RLS |
| [Yönetici Paneli](./docs/07-ADMIN-PANEL.md) | Admin özellikleri |
| [Personel Paneli](./docs/08-PERSONEL-PANEL.md) | PWA ve sekmeler |
| [İş Kuralları](./docs/09-IS-KURALLARI.md) | Formüller |
| [API Referansı](./docs/10-API-REFERANSI.md) | REST endpoint'ler |
| [Kurulum](./docs/11-KURULUM-VE-DEPLOY.md) | Yerel + Vercel |
| [Proje Tanıtımı](./docs/CREWLEDGER_PROFESOR_TANITIM.md) | Ürün özeti |

---

## Hızlı başlangıç

```bash
git clone https://github.com/arjenxyz/personel.git
cd personel
npm install
cp .env.example .env.local   # veya docs/11-KURULUM-VE-DEPLOY.md şablonunu kullan
# Supabase migration'ları sırayla çalıştır (supabase/migrations/)
npm run dev
```

Detaylı kurulum: [docs/11-KURULUM-VE-DEPLOY.md](./docs/11-KURULUM-VE-DEPLOY.md)

---

## Teknoloji

Next.js 15 · React 18 · TypeScript · Tailwind CSS · Supabase (PostgreSQL) · Vercel

---

## Sürüm

**v0.1.0** — Haziran 2026

---

*CrewLedger — Construction Workforce Platform*
