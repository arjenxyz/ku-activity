# TWA / Android

Web sitesini APK yapan katman (Bubblewrap).

Kısa özet: [docs/apk.md](../docs/apk.md)

## Paketler

- Personel → `app.crewledger.personel`
- Admin → `app.crewledger.admin`

## Sık komutlar

```bash
npm run twa:fingerprint
npm run twa:notification-permissions
npm run apk:build-upload:personnel
```

## Asset Links

`/.well-known/assetlinks.json` → package ID + SHA-256 eşleşmeli.  
Yanlışsa uygulama Chrome gibi açılır.

Fingerprint: `npm run twa:fingerprint`
