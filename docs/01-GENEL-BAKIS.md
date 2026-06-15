# 01 — Genel Bakış

## Proje adı ve tanım

**CrewLedger**, inşaat, şantiye ve taşeronluk ekosisteminde çalışan personelin **puantaj (yevmiye)**, **mesai**, **avans**, **kesinti**, **asgari ücret tamamlama**, **bordro** ve **dijital işe alım** süreçlerini tek platformda yöneten web tabanlı bir **iş gücü yönetim sistemidir**.

| Alan | Açıklama |
|------|----------|
| **Ürün adı** | CrewLedger |
| **Canlı adres** | [crewledger.vercel.app](https://crewledger.vercel.app) |
| **Slogan (EN)** | Construction Workforce Platform |
| **Slogan (TR)** | İnşaat Personel Yönetimi |
| **Hedef sektör** | İnşaat, şantiye, taşeron firmalar |
| **Dağıtım modeli** | SaaS — çok kiracılı (multi-tenant) proje yapısı |

---

## Neden var?

Türkiye’de inşaat sektöründe on binlerce işçi **günlük yevmiye** ile çalışır. Ödemeler çoğunlukla:

- Kağıt puantaj defterleri
- WhatsApp mesajları
- Excel tabloları
- Sözlü anlaşmalar

üzerinden yürütülür. Bu yöntemler **hata**, **şeffaflık eksikliği**, **uyuşmazlık** ve **KVKK riski** doğurur.

CrewLedger, yönetici ile personelin **aynı veri kaynağını** görmesini ve kritik kayıtların **çift onay** ile kesinleşmesini sağlayarak bu sorunu yazılım mimarisi düzeyinde ele alır.

---

## Temel ilkeler

1. **Şeffaflık** — Personel, kendi yevmiye ve finans özetini yöneticiyle aynı mantıkta görür.
2. **Çift onay** — Bir çalışma günü, hem yönetici hem personel onayı olmadan “kesin” sayılmaz.
3. **Denetlenebilirlik** — İtiraz, sözleşme onayı ve dışa aktarma (hukuki dosya) izleri tutulur.
4. **Güvenlik** — T.C. kimlik, IBAN gibi veriler uygulama katmanında şifrelenir.
5. **Mobil öncelik** — Personel paneli PWA olarak telefona kurulabilir; şantiye koşullarına uygundur.

---

## Kullanıcı rolleri

| Rol | Kim? | Erişim |
|-----|------|--------|
| **Admin (Yönetici)** | Şantiye sorumlusu, taşeron, İK | Proje bazlı tam yönetim |
| **Personel** | Saha işçisi | Kendi kayıtları, onay, finans özeti |
| **Developer** | Platform operatörü | Doğrulama kodları, sistem araçları |
| **Owner** | Platform sahibi | Genişletilmiş platform erişimi |

Her yönetici (admin), **yalnızca kendi oluşturduğu projelere** erişir — kiracı izolasyonu (`030_admin_project_isolation`).

---

## Platform bileşenleri

```
┌─────────────────────────────────────────────────────────────┐
│              crewledger.vercel.app                             │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  Ana site   │ Admin Panel │Personel Panel│ Developer Panel │
│     /       │/admin-panel │/personnel-   │/developer-panel │
│  (tanıtım)  │             │    panel     │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Next.js API      │
                    │  (serverless)     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Supabase         │
                    │  PostgreSQL + Auth│
                    │  Storage + RLS    │
                    └───────────────────┘
```

---

## Modül özeti

| Modül | Açıklama |
|-------|----------|
| **Proje yönetimi** | Şantiye oluşturma, personel atama, durum takibi |
| **Yevmiye / puantaj** | Tam/yarım gün, çift onay, itiraz |
| **Mesai** | Çeyrek / yarım / tam mesai; günden ayrı kazanç |
| **Finans** | Avans, kesinti, asgari, bordro |
| **Maaş politikası** | Şirket/proje bazlı asgari ve ödeme kuralları |
| **Başvuru** | QR kod, selfie, sözleşme OTP, admin onayı |
| **Sözleşmeler** | Versiyonlu metin, scroll + OTP onay |
| **Hukuki dosya** | ZIP/CSV/JSON dışa aktarma |
| **PWA** | Kurulabilir personel uygulaması |

---

## İlgili belgeler

- [Problem ve Çözüm](./02-PROBLEM-VE-COZUM.md)
- [Mimari](./03-MIMARI.md)
- [Proje Tanıtımı](./CREWLEDGER_PROFESOR_TANITIM.md)
