import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, DEFAULT_SUPPORT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'CrewLedger veri işleme ve gizlilik politikası.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <BrandMark size="sm" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-slate-500">Gizlilik politikası</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate prose-sm sm:prose-base">
        <h1>Gizlilik Politikası</h1>
        <p className="lead text-slate-600">
          Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h2>1. Veri sorumlusu</h2>
        <p>
          CrewLedger (&quot;Platform&quot;), inşaat ve şantiye operasyonlarında personel yönetimi
          hizmeti sunar. Bu politika, web uygulaması ve mobil (PWA / TWA) istemciler üzerinden
          işlenen kişisel verileri açıklar.
        </p>

        <h2>2. Toplanan veriler</h2>
        <ul>
          <li>
            <strong>Personel:</strong> kimlik ve iletişim bilgileri, doğum tarihi, IBAN, profil
            fotoğrafı, puantaj ve yoklama kayıtları.
          </li>
          <li>
            <strong>Yönetici:</strong> ad, e-posta, telefon, firma/şantiye bilgileri, hesap
            güvenlik verileri.
          </li>
          <li>
            <strong>Teknik:</strong> oturum çerezleri, cihaz türü, hata günlükleri (kimlik doğrulama
            ve güvenlik amaçlı).
          </li>
        </ul>

        <h2>3. İşleme amaçları</h2>
        <p>
          Veriler; puantaj ve ücret hesaplama, yoklama, sözleşme onayı, yönetici–personel iletişimi
          ve yasal yükümlülüklerin yerine getirilmesi için işlenir.
        </p>

        <h2>4. Saklama ve güvenlik</h2>
        <p>
          Veriler şifreli bağlantı (HTTPS) ile iletilir. Hassas alanlar (T.C. kimlik, IBAN vb.)
          sunucu tarafında ek şifreleme ile korunur. Erişim, rol tabanlı yetkilendirme ile
          sınırlandırılır.
        </p>

        <h2>5. Üçüncü taraflar</h2>
        <p>
          Altyapı için barındırma ve veritabanı hizmetleri (ör. Vercel, Supabase) kullanılır. Bu
          sağlayıcılar yalnızca hizmetin sunulması için gerekli verilere erişir.
        </p>

        <h2>6. Haklarınız</h2>
        <p>
          KVKK kapsamında verilerinize erişim, düzeltme, silme ve itiraz haklarınız vardır. Talep
          için yöneticiniz veya{' '}
          <a href={`mailto:${DEFAULT_SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
            {DEFAULT_SUPPORT_EMAIL}
          </a>{' '}
          üzerinden iletişime geçebilirsiniz.
        </p>

        <h2>7. Google Play / mobil uygulama</h2>
        <p>
          Android uygulamaları (Trusted Web Activity), aynı web platformunu tam ekran gösterir.
          Kamera yalnızca QR yoklama gibi açık kullanıcı eylemleri için, cihaz izniyle kullanılır.
        </p>

        <p className="text-sm text-slate-500 not-prose pt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Ana sayfa
          </Link>
        </p>
      </main>
    </div>
  );
}
