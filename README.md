# CrewLedger

Şantiye personeli için yevmiye, mesai, avans ve işe alım uygulaması.

Canlı: [crewledger.vercel.app](https://crewledger.vercel.app)

## Ne işe yarar?

Yönetici yoklama girer, personel telefonda görür ve onaylar.  
Kağıt / Excel / WhatsApp yerine **tek ortak kayıt**.

| Kim | Ne yapar |
|-----|----------|
| Yönetici | Proje, personel, yoklama, avans, kesinti |
| Personel | Kendi günlerini görür, onaylar, QR okutur |
| Developer | Platform araçları, APK yayınlama |

## Tech stack

Next.js 15 · TypeScript · Tailwind · Supabase · Vercel  
Android tarafı: TWA (Bubblewrap) — web’i APK gibi paketler

## Çalıştır

```bash
git clone https://github.com/arjenxyz/personel.git
cd personel
npm install
cp .env.example .env.local
```

`.env.local` içine en az şunları yaz:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIELD_ENCRYPTION_KEY` (64 hex karakter)

Sonra:

```bash
# Supabase’de supabase/migrations/ dosyalarını sırayla çalıştır
npm run dev
```

→ [localhost:3000](http://localhost:3000)

Detay: [docs/kurulum.md](./docs/kurulum.md)

## Klasörler (kısa)

```
src/app/admin-panel/       → yönetici UI
src/app/personnel-panel/   → personel UI
src/app/api/               → API route’lar
src/lib/                   → iş mantığı
supabase/migrations/       → veritabanı
twa/ + twa-build/          → Android APK
docs/                      → kısa dokümanlar
```

Daha fazla: [docs/kod-haritasi.md](./docs/kod-haritasi.md)

## Önemli kural

Bir çalışma günü, **yönetici + personel** ikisi de onaylamadan kesin sayılmaz.  
Bu veritabanı seviyesinde zorunlu.

## Dokümanlar

| Dosya | Ne anlatır |
|-------|------------|
| [docs/nedir.md](./docs/nedir.md) | Ürün özeti |
| [docs/kurulum.md](./docs/kurulum.md) | Env + deploy |
| [docs/kod-haritasi.md](./docs/kod-haritasi.md) | Nerede ne var |
| [docs/is-kurallari.md](./docs/is-kurallari.md) | Yoklama, mesai, asgari |
| [docs/apk.md](./docs/apk.md) | APK / TWA |

## Lisans

Proje sahibi — özel kullanım.
