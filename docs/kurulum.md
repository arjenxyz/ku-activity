# Kurulum

## Gerekli

- Node 20+
- npm
- Supabase projesi
- (deploy için) Vercel

## Adımlar

```bash
git clone https://github.com/arjenxyz/personel.git
cd personel
npm install
cp .env.example .env.local
```

### Env (zorunlu)

`.env.example` dosyası şablon. En az:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FIELD_ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`FIELD_ENCRYPTION_KEY` → 64 hex karakter (T.C. / IBAN şifreleme için).

Örnek üretim:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Veritabanı

`supabase/migrations/` içindeki SQL dosyalarını **sırayla** (001, 002, …) Supabase SQL Editor’da çalıştır.

### Çalıştır

```bash
npm run dev
```

## Deploy (Vercel)

1. Repo’yu Vercel’e bağla
2. Aynı env değişkenlerini Vercel’e yaz
3. `NEXT_PUBLIC_APP_URL` = production URL
4. Deploy

Push → Vercel otomatik build alır.

## Faydalı scriptler

```bash
npm run verify:vapid          # push anahtarları
npm run apk:build-upload:personnel
```
