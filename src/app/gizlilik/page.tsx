import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';
import { getVolunteerProjectSummary } from '@/lib/platform-legal-content';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'CrewLedger gönüllülük platformu gizlilik politikası.',
};

export default function PrivacyPage() {
  const p = getPlatformInfo();
  const s = getVolunteerProjectSummary();

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
          Son güncelleme:{' '}
          {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h2>1. Kimiz?</h2>
        <p>
          {s.developerLine} {s.noCompanyLine} Platform adresi:{' '}
          <a href={p.url} className="text-blue-600 hover:underline">
            {p.url}
          </a>
        </p>

        <h2>2. Toplanan veriler</h2>
        <ul>
          <li>
            <strong>Personel:</strong> kimlik, iletişim, IBAN, doğum tarihi, profil fotoğrafı,
            yevmiye, avans, kesinti, yoklama ve puantaj kayıtları.
          </li>
          <li>
            <strong>Yönetici:</strong> ad, e-posta, proje/şantiye bilgileri, oturum güvenliği.
          </li>
          <li>
            <strong>Teknik:</strong> HttpOnly oturum çerezleri, cihaz türü, hata günlükleri.
          </li>
        </ul>

        <h2>3. Şeffaflık ilkesi</h2>
        <p>{s.transparencyLine}</p>

        <h2>4. İşleme amaçları</h2>
        <p>
          Veriler yalnızca dijital personel takibi, şeffaf finansal kayıt, yoklama, sözleşme onayı
          ve platform güvenliği için işlenir. Veri satışı veya reklam profillemesi yapılmaz.
        </p>

        <h2>5. Saklama ve güvenlik</h2>
        <p>
          HTTPS ile iletim; hassas alanlarda AES-256-GCM şifreleme; rol tabanlı erişim. T.C. kimlik
          NVI ile doğrulanmaz — yalnızca algoritmik format kontrolü uygulanır.
        </p>

        <h2>6. Üçüncü taraflar</h2>
        <p>
          Vercel (barındırma), Supabase (veritabanı), Brevo (e-posta), Google Cloud Vision (isteğe
          bağlı dekont OCR). Yalnızca hizmet sunumu için gerekli verilere erişirler.
        </p>

        <h2>7. Cihaz izinleri</h2>
        <p>
          Kamera yalnızca QR yoklama gibi açık kullanıcı eylemlerinde, cihaz izniyle kullanılır.
          Arka planda gizli kayıt yapılmaz. Ayrıntılar personel sözleşmelerindeki &quot;Cihaz
          İzinleri&quot; metninde yer alır.
        </p>

        <h2>8. Haklarınız</h2>
        <p>
          KVKK kapsamındaki haklarınız için önce kaydı oluşturan yöneticinize veya{' '}
          <a href={`mailto:${p.contactEmail}`} className="text-blue-600 hover:underline">
            {p.contactEmail}
          </a>{' '}
          adresine başvurabilirsiniz.
        </p>

        <h2>9. Gönüllülük</h2>
        <p>{s.optionalUseLine}</p>

        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Ana sayfa
          </Link>
          <Link href="/kvkk" className="text-blue-600 hover:underline">
            KVKK Aydınlatma
          </Link>
          <Link href="/kullanim-sartlari" className="text-blue-600 hover:underline">
            Kullanım Şartları
          </Link>
        </p>
      </main>
    </div>
  );
}
