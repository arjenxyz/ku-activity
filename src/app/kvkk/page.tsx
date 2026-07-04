import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'CrewLedger Kişisel Verilerin Korunması Kanunu aydınlatma metni.',
};

export default function KvkkPage() {
  const p = getPlatformInfo();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <BrandMark size="sm" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-slate-500">KVKK Aydınlatma Metni</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate prose-sm sm:prose-base">
        <h1>KVKK Aydınlatma Metni</h1>
        <p className="lead text-slate-600">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) m.10 uyarınca
          bilgilendirme metnidir.
        </p>

        <h2>1. Platform ve veri sorumlusu yapısı</h2>
        <p>
          <strong>{p.name}</strong>, {p.developerName} tarafından işletilen {p.nature}dur. Tüzel
          kişiliği yoktur; herhangi bir şirket adına veri sorumlusu sıfatı taşımaz.
        </p>
        <p>
          Personel başvurusu ve kayıtları, pratikte <strong>platformu kullanan yönetici kişi</strong>{' '}
          (şantiye sorumlusu, ekip başı vb.) tarafından oluşturulur. İş ilişkisinin tarafı olan
          gerçek işveren/yüklenici mevzuat uyarınca ayrı veri sorumlusu olabilir.
        </p>
        <p>
          <strong>Platform operatörü / teknik veri işleyen:</strong> {p.developerName} — altyapı,
          barındırma, şifreleme ve yazılım hizmeti sunar. İletişim:{' '}
          <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>
        </p>

        <h2>2. İşlenen veri kategorileri</h2>
        <ul>
          <li>Kimlik: ad-soyad, T.C. kimlik numarası (format kontrolü; NVI doğrulaması yok), doğum tarihi</li>
          <li>İletişim: telefon, e-posta</li>
          <li>Finans: IBAN, yevmiye, avans, kesinti, asgari ücret kayıtları</li>
          <li>Operasyon: puantaj, yoklama (QR), mesai, proje ataması</li>
          <li>Görsel: başvuru fotoğrafı (yönetici manuel teyidi)</li>
          <li>İşlem güvenliği: oturum, onay logları, IP (sınırlı)</li>
        </ul>

        <h2>3. İşleme amaçları</h2>
        <p>
          Veriler; personel kaydı, şeffaf finansal takip, yoklama, sözleşme onayı, teknik destek
          ve güvenlik amacıyla işlenir. Ticari pazarlama veya üçüncü tarafa satış yapılmaz.
        </p>

        <h2>4. Hukuki sebepler</h2>
        <p>
          Açık rıza (KVKK m.5/1), sözleşmenin kurulması/ifası (m.5/2-c), hukuki yükümlülük (m.5/2-ç)
          ve meşru menfaat (m.5/2-f) — ölçülülük ilkesine uygun olarak.
        </p>

        <h2>5. Aktarım</h2>
        <p>
          Barındırma (Vercel), veritabanı (Supabase), e-posta (Brevo) gibi teknik hizmet sağlayıcıları;
          yasal zorunluluk halinde resmi makamlar. Veri satışı yapılmaz.
        </p>

        <h2>6. Güvenlik</h2>
        <p>
          T.C. kimlik, IBAN ve doğum tarihi AES-256-GCM ile şifrelenir; arama için HMAC hash
          kullanılır. HTTPS ve rol tabanlı erişim uygulanır.
        </p>

        <h2>7. Haklarınız (KVKK m.11)</h2>
        <p>
          Bilgi talebi, düzeltme, silme, itiraz ve şikâyet (KVKK Kurulu) haklarınız vardır. Önce
          kaydı oluşturan yöneticinize; teknik konularda{' '}
          <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a> adresine başvurabilirsiniz.
        </p>

        <h2>8. Saklama</h2>
        <p>
          Veriler, işleme amacının gerektirdiği süre boyunca saklanır; amaç ortadan kalktığında silinir
          veya anonimleştirilir.
        </p>

        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Ana sayfa
          </Link>
          <Link href="/gizlilik" className="text-blue-600 hover:underline">
            Gizlilik Politikası
          </Link>
          <Link href="/kullanim-sartlari" className="text-blue-600 hover:underline">
            Kullanım Şartları
          </Link>
        </p>
      </main>
    </div>
  );
}
