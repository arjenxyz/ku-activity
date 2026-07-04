import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { getPlatformInfo } from '@/lib/platform-config';
import { getVolunteerProjectSummary } from '@/lib/platform-legal-content';

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'CrewLedger gönüllülük platformu kullanım şartları.',
};

export default function TermsPage() {
  const p = getPlatformInfo();
  const s = getVolunteerProjectSummary();

  return (
    <LegalPageShell title="Kullanım Şartları">
      <p className="lead text-slate-600">
        Son güncelleme:{' '}
        {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2>1. Platformun niteliği</h2>
      <p>
        <strong>{p.name}</strong> ({p.url}), {p.developerName} tarafından geliştirilen,{' '}
        <strong>{p.nature}</strong>dur. Herhangi bir anonim şirket, limited şirket, taşeron firması
        veya resmi işveren unvanı adına hareket etmez; tüzel kişiliği bulunmaz.
      </p>
      <p>{s.noCompanyLine}</p>

      <h2>2. Gönüllülük ve zorunluluk olmaması</h2>
      <p>{s.optionalUseLine}</p>
      <p>
        Yöneticiler (şantiye sorumlusu, ekip başı, proje yöneticisi vb.) platformu yalnızca kendi
        inisiyatifleriyle kullanabilir. Personel, platformu kullanmayı reddedebilir; bu durumda
        taraflar arasındaki ücret ve çalışma ilişkisi mevzuattaki resmi usullere göre ayrıca
        yürütülür.
      </p>

      <h2>3. Hizmetin kapsamı</h2>
      <p>
        Platform; yevmiye, puantaj, yoklama (QR), avans talebi, kesinti, asgari ücret takibi ve
        benzeri finansal/operasyonel kayıtların dijital ortamda tutulmasına ve{' '}
        <strong>hem yönetici hem personel tarafından görüntülenmesine</strong> aracılık eder. Amaç,
        şantiye finansal takibini rahat, dijital ve şeffaf kılmaktır.
      </p>

      <h2>4. &quot;Olduğu gibi&quot; sunum</h2>
      <p>
        Platform ücretsiz ve gönüllülük esasına göre sunulur. Kesintisiz çalışma, veri kaybı
        olmaması veya belirli bir hukuki sonuç doğurması garanti edilmez. Teknik bakım, güncelleme
        veya projenin sonlandırılması mümkündür.
      </p>

      <h2>5. Resmi geçerlilik ve mahkeme delili</h2>
      <p>
        <strong>Önemli:</strong> {s.legalLine}
      </p>
      <ul>
        <li>
          <strong>Resmi bordro / SGK / vergi kayıtlarının yerine geçmez.</strong> İş hukuku
          uyuşmazlıklarında öncelik resmi işveren kayıtları, bordro, banka dekontları ve tanık
          beyanlarına aittir.
        </li>
        <li>
          <strong>Elektronik onay kayıtları</strong> (sözleşme kabulü, OTP, tarih-saat logları)
          6098 sayılı TBK ve ilgili mevzuat çerçevesinde <em>destekleyici delil</em> niteliğinde
          olabilir; tek başına kesin delil sayılması garanti edilmez.
        </li>
        <li>
          <strong>Sistemdeki yevmiye, avans ve kesinti kayıtları</strong> taraflar arası şeffaflık
          ve mutabakat amacı taşır; mahkemede bağlayıcı hakediş belgesi olduğu iddia edilmez.
        </li>
        <li>
          <strong>T.C. kimlik doğrulaması</strong> NVI/KPS/e-Devlet ile yapılmaz; yalnızca format
          kontrolü ve yönetici manuel onayı uygulanır.
        </li>
        <li>
          <strong>Dekont OCR analizi</strong> yardımcı araçtır; banka kayıtlarının yerine geçmez.
        </li>
      </ul>

      <h2>6. Sorumluluk sınırı</h2>
      <p>
        {p.developerName}, platform operatörü sıfatıyla; kullanıcıların girdiği verilerin doğruluğu,
        yöneticiler ile personel arasındaki özel hukuk ilişkileri, ücret ödenmemesi, yanlış kesinti
        veya iş kazası gibi saha olaylarından <strong>doğrudan sorumlu tutulamaz</strong>. Bu
        konulardaki yükümlülükler ilgili işveren, yüklenici ve mevzuat hükümlerine tabidir.
      </p>

      <h2>7. Fikri mülkiyet</h2>
      <p>
        Yazılım, arayüz ve marka unsurları {p.developerName}&apos;a aittir. İzinsiz ticari çoğaltma
        veya satış yapılamaz; gelecekte lisanslama ayrıca duyurulur.
      </p>

      <h2>8. İletişim</h2>
      <p>
        Sorularınız için:{' '}
        <a href={`mailto:${p.contactEmail}`} className="text-blue-600 hover:underline">
          {p.contactEmail}
        </a>
      </p>
    </LegalPageShell>
  );
}

function LegalPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
          <BrandMark size="sm" />
          <div>
            <p className="font-semibold">{APP_NAME}</p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate prose-sm sm:prose-base">
        <h1>{title}</h1>
        {children}
        <p className="text-sm text-slate-500 not-prose pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Ana sayfa
          </Link>
          <Link href="/gizlilik" className="text-blue-600 hover:underline">
            Gizlilik
          </Link>
          <Link href="/kvkk" className="text-blue-600 hover:underline">
            KVKK
          </Link>
        </p>
      </main>
    </div>
  );
}
