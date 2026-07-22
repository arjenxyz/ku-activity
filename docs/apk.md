# APK (TWA)

CrewLedger’ın Android APK’sı **TWA** (Trusted Web Activity):  
Chrome içinde web sitesini açan ince bir kabuk.

Paketler:

| App | Package ID |
|-----|------------|
| Personel | `app.crewledger.personel` |
| Admin | `app.crewledger.admin` |

## Kısa akış

```bash
# Personel APK build + developer panel’e upload
npm run apk:build-upload:personnel
```

Bildirim izni patch’i:

```bash
npm run twa:notification-permissions
```

Keystore parmak izi:

```bash
npm run twa:fingerprint
```

## Önemli env

```env
TWA_PERSONNEL_PACKAGE_ID=app.crewledger.personel
TWA_ADMIN_PACKAGE_ID=app.crewledger.admin
TWA_PERSONNEL_SHA256_FINGERPRINTS=
TWA_ADMIN_SHA256_FINGERPRINTS=
```

Parmak izi yanlışsa uygulama Chrome gibi açılır (adres çubuğu çıkar).

## Not

TWA = web + Chrome. Push bazen kırılgan olabilir.  
Native (Capacitor / FCM) ayrı bir adım.

Daha fazla: `twa/README.md`
