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

**Önemli:** `assetlinks.json` parmak izi olmadan boş döner; Play yayını öncesi mutlaka doldurun.

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

### 5. Kamera izni (QR yoklama)

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
