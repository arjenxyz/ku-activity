import crypto from 'crypto';

function urlBase64ToBuffer(base64String: string): Buffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

function bufferToUrlBase64(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** VAPID private key'den public key türetir (P-256). */
export function deriveVapidPublicKey(privateKeyBase64Url: string): string {
  const privateKeyBytes = urlBase64ToBuffer(privateKeyBase64Url);
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(privateKeyBytes);
  return bufferToUrlBase64(ecdh.getPublicKey());
}

export function vapidKeyPairMatches(publicKey: string, privateKey: string): boolean {
  try {
    return deriveVapidPublicKey(privateKey) === publicKey;
  } catch {
    return false;
  }
}
