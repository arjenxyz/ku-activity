# 12 — Bursluk ve Akademik Başvuru Rehberi

Bu belge, CrewLedger projesini **üniversite bursu**, **TEKNOFEST**, **TÜBİTAK 2209**, **bitirme projesi** veya **sosyal etki yarışması** başvurularında kullanmak isteyenler için hazırlanmıştır.

---

## Proje özeti (1 paragraf — kopyala-yapıştır)

CrewLedger, inşaat ve şantiye sektöründe günlük yevmiye ile çalışan personelin puantaj, mesai, avans, kesinti ve asgari ücret süreçlerini dijitalleştiren web tabanlı bir iş gücü yönetim platformudur. Sistem, yönetici ve personelin aynı veri kaynağını görmesini sağlar; çalışma günlerinin kesinleşmesi için mimari düzeyde çift onay zorunluluğu getirir. T.C. kimlik ve IBAN gibi hassas veriler şifrelenir; personel mobil PWA üzerinden kendi maaş dökümünü takip edebilir. Proje; Next.js, TypeScript, PostgreSQL (Supabase) ve modern güvenlik pratikleri ile geliştirilmiş full-stack bir yazılım ürünüdür.

---

## Problem (burs dosyası için)

İnşaat sektöründe yaklaşık **2 milyon+** işçi günlük yevmiye ile çalışmaktadır (TÜİK / sektör tahminleri). Puantaj kayıtlarının kağıt, WhatsApp ve Excel ile tutulması:

- Personelin kendi verisini **doğrulayamamasına**
- Ödeme **uyuşmazlıklarına**
- **KVKK ihlali** riskine (kimlik/IBAN paylaşımı)
- İşe giriş süreçlerinin **yavaş ve denetlenemez** olmasına

yol açar. CrewLedger bu yapısal sorunu hedef alır.

---

## Çözüm ve yenilik

| Yenilik | Açıklama |
|---------|----------|
| **Çift onay (DB enforced)** | UI değil, PostgreSQL trigger ile iş kuralı |
| **Personel şeffaflığı** | İşçi kendi finans özetini görür — güç asimetrisini azaltır |
| **Sektöre özel model** | Yevmiye + mesai + asgari taşeron farkı |
| **Dijital işe alım** | QR, OTP sözleşme, selfie, admin onay |
| **PWA** | App store gerektirmeden şantiye dağıtımı |
| **Maaş politikası motoru** | Şirket bazlı kural tanımı |

---

## Teknik derinlik (jüri için)

| Alan | Kanıt |
|------|-------|
| Full-stack | 50+ API route, 40 migration |
| Güvenlik | AES-256-GCM, RLS, HttpOnly session |
| İş kuralları | RPC + trigger, `src/lib/` servis katmanı |
| UX | 7 sekmeli personel paneli, mobil alt menü |
| Dokümantasyon | `docs/` klasörü (bu set) |

---

## Sosyal etki

- **İşçi hakları:** Şeffaf puantaj, itiraz mekanizması
- **Adil ödeme:** Asgari tamamlama hesabının görünür olması
- **Dijital dönüşüm:** Kağıtsız işe alım ve sözleşme
- **KVKK:** Şifreli hassas veri, minimum exposure

---

## Ölçülebilir hedefler (pilot)

| Metrik | Hedef |
|--------|-------|
| Puantaj onay süresi | < 24 saat |
| Uyuşmazlık çözüm süresi | Kayıt bazlı izlenebilir |
| Personel panel kullanımı | Aktif personel / toplam |
| Başvuru tamamlama | Dijital uçtan uca |

---

## Ekip ve rol dağılımı (örnek şablon)

Başvuru formunda doldurun:

| Üye | Rol | Katkı |
|-----|-----|-------|
| … | Full-stack geliştirme | Mimari, API, DB |
| … | UI/UX | Personel paneli, PWA |
| … | İş analizi | Saha gereksinimleri, asgari kuralları |
| … | Danışman | Akademik rehberlik |

---

## Sunumda kullanılacak demo akışı (5 dk)

1. Ana sayfa — problem ve özellikler
2. Admin — yevmiye gir + mesai
3. Personel PWA — onay kutusu
4. Personel — **Asgari sekmesi** (hak edilen / kalan)
5. İtiraz → admin düzeltme
6. (Opsiyonel) Başvuru QR akışı

---

## Ekler listesi (başvuru paketi)

- [ ] Bu `docs/` klasörü PDF export
- [ ] [Profesör Tanıtım](./CREWLEDGER_PROFESOR_TANITIM.md)
- [ ] Ekran görüntüleri (admin + personel)
- [ ] Mimari diyagram ([03-MIMARI.md](./03-MIMARI.md))
- [ ] GitHub repo linki
- [ ] (Varsa) pilot şantiye mektubu / iş birliği

---

## Sık sorulan jüri soruları

**Neden mevcut İK yazılımları yetmiyor?**  
Genel İK ürünleri bordrolu çalışan modeline göredir; günlük yevmiye, mesai birimi ve taşeron asgari farkı inşaat pratiğine özgüdür.

**Çift onayı bypass edebilir mi yönetici?**  
Hayır — `approved` bayrağı trigger ile korunur; tek taraflı onay maaş RPC’sine tam gün olarak yansımaz (onaylı filtre).

**Veriler nerede duruyor?**  
Supabase (AB / EU region seçilebilir), şifreli hassas alanlar uygulama katmanında.

**Gelir modeli?**  
SaaS — proje başına abonelik (planlanan); burs kapsamında açık kaynak inceleme.

---

## Lisans ve kullanım

Proje akademik değerlendirme ve burs başvuruları için dokümante edilmiştir. Ticari kullanım ve lisans koşulları proje sahibi ile görüşülmelidir.

---

## İletişim şablonu

| Alan | Değer |
|------|-------|
| Proje | CrewLedger |
| Web | https://crewledger.app |
| Repo | https://github.com/arjenxyz/personel |
| Destek | hello@crewledger.app |

---

*Bu belge burs başvuru dosyanızın “Proje Tanıtımı” bölümüne temel oluşturur. Kurumunuzun formatına göre kısaltıp genişletebilirsiniz.*
