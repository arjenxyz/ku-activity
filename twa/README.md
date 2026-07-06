# CrewLedger — Google Play TWA (Trusted Web Activity)

Tek web sitesi (`https://crewledger.vercel.app`), **iki ayrı Play Store uygulaması**:

| Uygulama | Paket ID | Manifest | Başlangıç |
|----------|----------|----------|-----------|
| **Personel** | `app.crewledger.personel` | `/manifest-personnel.webmanifest` | `/personnel-panel/login` |
| **Yönetici** | `app.crewledger.admin` | `/manifest-admin.webmanifest` | `/admin-panel/login` |

## Web tarafı (bu repo — hazır)

- [x] İki ayrı Web App Manifest
- [x] PNG ikonlar: `/icons/personnel/192`, `/icons/admin/512`, …
- [x] Service Worker (`/sw.js`) — oturum sayfaları network-only
- [x] Digital Asset Links: `/.well-known/assetlinks.json`
- [x] Gizlilik politikası: `/gizlilik` (Play Console zorunlu URL)

## Vercel ortam değişkenleri

Deploy sonrası **Project → Settings → Environment Variables**:

```env
NEXT_PUBLIC_APP_URL=https://crewledger.vercel.app

# Android paket adları (Bubblewrap ile aynı)
TWA_PERSONNEL_PACKAGE_ID=app.crewledger.personel
TWA_ADMIN_PACKAGE_ID=app.crewledger.admin

# SHA-256 sertifika parmak izleri (virgülle ayırın: debug + Play imza)
# Örnek format: AA:BB:CC:...
TWA_PERSONNEL_SHA256_FINGERPRINTS=
TWA_ADMIN_SHA256_FINGERPRINTS=
```

Parmak izi almak (Bubblewrap / Android Studio oluşturduktan sonra):

```bash
keytool -list -v -keystore android.keystore -alias android
```

**Önemli:** `assetlinks.json` parmak izi APK imzasıyla eşleşmezse uygulama **Chrome gibi** açılır (üstte adres çubuğu, çarpı ile kapanma). Doğru parmak izi: `npm run twa:fingerprint` veya repo içindeki `twa-fingerprints.defaults.ts`.

Doğrulama: [Google Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)

## Bubblewrap ile APK/AAB üretimi

### 1. Gereksinimler

- Node.js 18+
- JDK 17
- Android SDK

```bash
npm install -g @bubblewrap/cli
```

### 2. Personel uygulaması

```bash
mkdir -p twa-build/personel && cd twa-build/personel
bubblewrap init --manifest https://crewledger.vercel.app/manifest-personnel.webmanifest
# Paket adı: app.crewledger.personel
bubblewrap build
```

**Açılış ekranı (splash):** Manifest `background_color` / `theme_color` ve `/icons/personnel/maskable/512` gökyüzü mavisi markayı kullanır. Bubblewrap `twa-manifest.json` içinde manifest ile uyumlu tutun:

```json
"backgroundColor": "#0ea5e9",
"themeColor": "#0284c7",
"splashScreenFadeOutDuration": 300
```

iOS PWA için tam ekran splash: `/icons/personnel/splash/{genişlik}/{yükseklik}` (layout'ta `apple-touch-startup-image` bağlı).

### 3. Yönetici uygulaması

```bash
mkdir -p twa-build/admin && cd twa-build/admin
bubblewrap init --manifest https://crewledger.vercel.app/manifest-admin.webmanifest
# Paket adı: app.crewledger.admin
bubblewrap build
```

Çıktı: `app-release-signed.apk` ve `app-release-bundle.aab`

### 4. Play Console

Her uygulama için ayrı listing:

1. **Uygulama adı** — CrewLedger Personel / CrewLedger Yönetici
2. **Gizlilik politikası URL** — `https://crewledger.vercel.app/gizlilik`
3. **Data safety** — kimlik, finans, fotoğraf toplama bildirimi
4. **Ekran görüntüleri** — telefon + (isteğe bağlı) 7" tablet
5. **AAB yükle** — Internal testing → Production

### 5. Bildirim izni ve ikonu (Android 13+ / API 33)

Push bildirimleri için her build öncesi otomatik yama:

```bash
node scripts/twa-notification-permissions.mjs twa-build/personel --bump
```

`npm run apk:build-upload:personnel` bu adımı otomatik çalıştırır. Yama:

- `POST_NOTIFICATIONS` + `NotificationPermissionRequestActivity` (AndroidManifest)
- `monochromeIconUrl` — soldaki küçük bildirim ikonu (beyaz silüet, `/icons/personnel/notification/96`)
- `targetSdkVersion 35`
- `LauncherActivity` — uygulama açılışında **sistem bildirim izni** diyaloğu

**Beyaz kare ikon görüyorsanız:** Eski APK'da `monochromeIconUrl` yoktur. Deploy sonrası yeni APK build edip yükleyin (`npm run apk:build-upload:personnel`).

Web tarafı (`PersonnelPushBootstrap`) yedek olarak bir kez `Notification.requestPermission()` çağırır.

Parmak izi / asset links doğru değilse uygulama Chrome gibi açılır ve bildirim akışı bozulur.

### 6. Kamera izni (QR yoklama)

Bubblewrap `init` sırasında kamera kullanımını sorar; personel uygulamasında **evet**.
Manifest'te `permissions` yoksa `twa-manifest.json` içinde:

```json
"features": {
  "locationDelegation": { "enabled": false }
}
```

Gerekirse Android `AndroidManifest.xml` içine `CAMERA` permission eklenir (`bubblewrap update` sonrası).

## Lighthouse PWA kontrolü

Chrome DevTools → Lighthouse → Progressive Web App:

- Personel: `https://crewledger.vercel.app/personnel-panel/login`
- Yönetici: `https://crewledger.vercel.app/admin-panel/login`

## Sık sorular

**İki ayrı web projesi gerekir mi?** Hayır. Tek Next.js deploy, iki Android sarmalayıcı.

**iOS?** TWA yalnızca Android. iOS için mevcut PWA / Ana Ekrana Ekle yeterli.

**Domain değişirse?** `NEXT_PUBLIC_APP_URL`, Bubblewrap host ve Play listing URL'lerini güncelleyin; `assetlinks.json` otomatik yeni domain'den sunulur.

## APK dağıtımı (siteden indirme)

Build sonrası APK **otomatik yüklenebilir**; **yayın için developer panel onayı gerekir**.

### Otomatik yükleme (önerilen)

1. Supabase'te `054_app_releases.sql` çalıştırın.
2. Vercel env: `APK_UPLOAD_SECRET`, `NEXT_PUBLIC_APP_URL`.
3. Bubblewrap klasörünü hazırlayın (`twa-build/personel` veya `twa-build/admin`).
4. Tek komut — build + otomatik upload:

```bash
# Ortam (PowerShell)
$env:APK_UPLOAD_SECRET="..."
$env:NEXT_PUBLIC_APP_URL="https://crewledger.vercel.app"

# Personel: bubblewrap build → otomatik yükle
npm run apk:build-upload:personnel

# Yönetici
npm run apk:build-upload:admin
```

Zaten build ettiyseniz sadece yükleme:

```bash
npm run apk:upload:personnel
npm run apk:upload:admin
```

Sürüm numarası `twa-manifest.json` içindeki `appVersionName` / `appVersionCode` alınır.

5. [Developer Panel → APK Sürümleri](/developer-panel/releases) — **Yayınla**.
6. Kullanıcılar `/apk` sayfasından indirir.

### GitHub Actions (opsiyonel)

`.github/workflows/apk-upload.yml` — Actions → **APK Upload** → manuel çalıştır.

Secrets: `APK_UPLOAD_SECRET`, `APP_URL`. `twa-build/*/app-release-signed.apk` dosyası gerekir.

### Manuel upload

```bash
node scripts/upload-apk.mjs --app personnel --file ./app-release-signed.apk --version 1.0.0 --code 1 --notes "Değişiklikler"
```

Personel ve yönetici için ayrı `--app personnel|admin` ile yükleyin.
