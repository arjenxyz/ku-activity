# 04 — Teknoloji Yığını

## Özet tablo

| Katman | Teknoloji | Sürüm (yaklaşık) |
|--------|-----------|------------------|
| Framework | Next.js (App Router) | 15.1.x |
| UI | React | 18.3.x |
| Dil | TypeScript | 5.x |
| Stil | Tailwind CSS | 3.4.x |
| Animasyon | Framer Motion | 12.x |
| Grafik | Recharts | 2.15.x |
| Tarih | Day.js, date-fns | — |
| Veritabanı | PostgreSQL (Supabase) | 15+ |
| Auth | Supabase Auth + özel personel oturumu | — |
| Depolama | Supabase Storage | — |
| E-posta | Brevo (Sendinblue) API | — |
| Rate limit | Upstash Redis | — |
| QR | html5-qrcode, qrcode | — |
| Arşiv | JSZip | — |
| Şifreleme | Node crypto (AES-256-GCM), bcryptjs | — |
| JWT | jose, jsonwebtoken | — |
| Deploy | Vercel | — |

---

## Frontend

### Next.js App Router

- **Server Components** ve **Client Components** ayrımı
- `src/app/` altında dosya tabanlı routing
- Dinamik segmentler: `[projectId]`, `[employeeId]`, `[slug]`
- `middleware.ts` ile route koruması

### UI bileşen kütüphanesi

Özel bileşen seti (harici UI framework yok):

- `src/components/personnel/*` — personel paneli
- `src/components/project/*` — admin proje modülleri
- `src/components/home/*` — landing page
- `src/components/auth/*` — giriş formları

### PWA

- `public/sw.js` — service worker
- `src/app/manifest.ts` — web app manifest
- `PWARegister`, `InstallPrompt` bileşenleri
- Personel panelinde kurulum banner’ı

---

## Backend (API Routes)

Tüm backend mantığı Next.js **Route Handlers** içinde:

```
src/app/api/
├── admin/          # Yönetici CRUD
├── personnel/      # Personel okuma + onay
├── public/         # Başvuru, sözleşme (anon)
├── auth/           # Giriş/çıkış
├── developer/      # Platform araçları
└── cron/           # Zamanlanmış görevler
```

İş kuralları `src/lib/` altında modüler:

| Modül | Görev |
|-------|-------|
| `work-log.ts` / `work-log-service.ts` | Onay durumu, mesai |
| `personnel-stats.ts` | Brüt, net, takvim |
| `minimum-wage.ts` / `wage-policy-calc.ts` | Asgari hesap |
| `registration-service.ts` | Başvuru akışı |
| `field-encryption.ts` | AES şifreleme |
| `contract-service.ts` | Sözleşme OTP |
| `legal-dossier/*` | Hukuki dosya export |

---

## Veritabanı (Supabase)

- **PostgreSQL** ilişkisel model
- **Row Level Security (RLS)** tüm hassas tablolarda
- **SECURITY DEFINER** RPC fonksiyonları
- **Trigger** ile iş kuralı enforcement
- **Migration** dosyaları: `supabase/migrations/*.sql`

---

## Harici servisler

### Brevo (e-posta)

- Sözleşme OTP gönderimi
- Personel hatırlatma e-postası (cron)
- Env: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`

### Upstash Redis (opsiyonel)

- API rate limiting
- Env: `REDIS_URL`, `REDIS_TOKEN`

---

## Geliştirme araçları

| Araç | Kullanım |
|------|----------|
| ESLint | `eslint-config-next` |
| Git | Versiyon kontrolü |
| Supabase SQL Editor | Migration uygulama |

---

## Neden bu yığın?

| Seçim | Gerekçe |
|-------|---------|
| Next.js | Full-stack tek repo, Vercel deploy, SSR |
| Supabase | Hızlı PostgreSQL + Auth + Storage |
| TypeScript | Tip güvenliği, büyük codebase |
| Tailwind | Hızlı mobil-first UI |
| PWA | App store olmadan şantiye dağıtımı |

---

## İlgili belgeler

- [Kurulum](./11-KURULUM-VE-DEPLOY.md)
- [Mimari](./03-MIMARI.md)
