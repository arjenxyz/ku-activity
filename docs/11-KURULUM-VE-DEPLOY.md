# 11 — Kurulum ve Deploy

## Gereksinimler

| Araç | Sürüm |
|------|-------|
| Node.js | 20 LTS önerilir |
| npm | 9+ |
| Git | — |
| Supabase hesabı | Ücretsiz tier yeterli (geliştirme) |
| Vercel hesabı | Deploy için |

---

## Yerel kurulum

### 1. Repoyu klonla

```bash
git clone https://github.com/arjenxyz/personel.git
cd personel
```

### 2. Bağımlılıkları yükle

```bash
npm install
```

### 3. Ortam değişkenleri

`.env.local` oluştur (`.env.example` yoksa aşağıdaki şablonu kullan):

```env
# Supabase (zorunlu)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Şifreleme (zorunlu — production)
FIELD_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Uygulama URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# E-posta — Brevo (OTP için)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=CrewLedger

# Opsiyonel
CRON_SECRET=random-secret
REDIS_URL=
REDIS_TOKEN=
NEXT_PUBLIC_SUPPORT_EMAIL=hello@crewledger.app
NEXT_PUBLIC_OFFICIAL_MINIMUM_WAGE_GROSS=33030
```

`FIELD_ENCRYPTION_KEY` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Supabase migration

Supabase Dashboard → SQL Editor:

1. `supabase/migrations/` dosyalarını **numara sırasıyla** çalıştır
2. Özellikle sıra: `001` → `036` (atlamadan)
3. Seed (isteğe bağlı): `seed_admin.sql`, `seed_contracts.sql`

### 5. Geliştirme sunucusu

```bash
npm run dev
```

Tarayıcı: http://localhost:3000

### 6. Production build test

```bash
npm run build
npm start
```

---

## Vercel deploy

1. GitHub reposunu Vercel’e bağla
2. Framework: **Next.js** (otomatik algılanır)
3. Environment Variables — tüm `.env.local` değerlerini ekle
4. Deploy

**Önemli:** `NEXT_PUBLIC_APP_URL` production domain olmalı (`https://crewledger.vercel.app`).

---

## Supabase yapılandırması

### Auth

- E-posta doğrulama: proje tercihine göre
- Site URL: Vercel domain
- Redirect URLs: `/admin-panel/**`

### Storage

- `employee-photos` bucket — private
- Migration `025` politikalarını uygula

### RLS

Migration’lar RLS politikalarını içerir. Manuel tablo ekleme yapılırsa RLS unutulmamalı.

---

## Cron (hatırlatma e-postası)

Vercel Cron veya harici scheduler:

```
GET https://crewledger.vercel.app/api/cron/personnel-pending-reminders
Authorization: Bearer {CRON_SECRET}
```

---

## Migration kontrol listesi

Yeni özellik sonrası eksik migration belirtileri:

- API `503` + `MIGRATION_REQUIRED`
- API `500` + `036_wage_policies.sql çalıştırın`
- Boş istatistik / null RPC

---

## Sorun giderme

| Sorun | Çözüm |
|-------|-------|
| Personel giriş 401 | `personnel_sessions` tablosu, migration 005+ |
| OTP gelmiyor | Brevo key; dev modda console log |
| Şifreleme hatası | `FIELD_ENCRYPTION_KEY` 64 hex karakter |
| Admin proje göremiyor | `created_by` eşleşmesi, migration 030 |
| Net asgari dahil değil | Migration 035 çalıştır |

---

## İlgili belgeler

- [Veritabanı](./05-VERITABANI.md)
- [Güvenlik](./06-GUVENLIK-VE-KVKK.md)
