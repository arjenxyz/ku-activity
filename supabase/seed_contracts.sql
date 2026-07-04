-- =========================================================================================
-- CREWLEDGER GÖNÜLLÜLÜK PLATFORMU — PERSONEL SÖZLEŞMELERİ
-- Geliştirici: Arjen Esen | Tüzel kişilik yok | Kar amacı gütmeyen gönüllülük projesi
--
-- Çalıştırma: Supabase SQL Editor veya 058 migration
-- Sürüm artırıldığında personel yeni metni tekrar onaylar.
-- =========================================================================================

UPDATE public.personnel_contracts
SET is_required = false, updated_at = now()
WHERE slug IN ('ekip-calismasi', 'ucret-yevmiye');

insert into public.personnel_contracts (slug, title, summary, content_html, version, is_required, sort_order)
values
(
  'platform-kullanim',
  'Platform Kullanım Şartları ve Gönüllülük Beyanı',
  'CrewLedger''in gönüllülük projesi olduğunu, şirkete bağlı olmadığını, kullanımın zorunlu olmadığını ve mahkeme/resmi geçerlilik sınırlarını kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} — {{PLATFORM_URL}}</p>
  <p><strong>Nitelik:</strong> {{PLATFORM_NATURE}} (tüzel kişilik yoktur)</p>
  <p><strong>Geliştirici / Operatör:</strong> {{DEVELOPER_NAME}} ({{DEVELOPER_ROLE}})</p>
  <p><strong>İletişim:</strong> {{PLATFORM_CONTACT}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> Platform kullanım şartları ve gönüllülük beyanı</p>
  <p><strong>Önemli:</strong> Bu metin herhangi bir anonim şirket, taşeron firması veya resmi işveren adına düzenlenmemiştir.</p>
</div>

<h2>1. PLATFORMUN TANIMI</h2>
<p><strong>{{PLATFORM_NAME}}</strong>, {{DEVELOPER_NAME}} tarafından geliştirilen, inşaat ve şantiye ortamlarında personel finansal takibini dijitalleştirmeyi amaçlayan <strong>kar amacı gütmeyen gönüllülük projesidir</strong>. Platform ticari bir işletme değildir; herhangi bir şirketin mülkiyetinde veya resmi temsilinde değildir.</p>
<p>Platform; e-Devlet, NVI/KPS/Mernis, SGK veya resmi bordro sistemleri ile entegre değildir. Resmi devlet kayıtlarının yerine geçmez.</p>

<h2>2. GÖNÜLLÜ KULLANIM — ZORUNLULUK YOK</h2>
<p>Hiçbir yönetici, ekip başı, şantiye sorumlusu veya işveren, personeli bu platformu kullanmaya <strong>zorlayamaz</strong>. Personel kaydı ve kullanım tamamen gönüllüdür.</p>
<p>Platformu kullanmayı reddeden personel ile taraflar arasındaki ücret, çalışma ve İSG ilişkisi ilgili mevzuat ve sahadaki fiili düzenlemelere göre ayrıca yürütülür.</p>

<h2>3. HİZMETİN KAPSAMI VE ŞEFFAFLIK</h2>
<p>Platform aşağıdaki kayıtların dijital ortamda tutulmasına ve <strong>hem yönetici hem personel tarafından görüntülenmesine</strong> aracılık eder:</p>
<ul>
  <li>Günlük yevmiye ve puantaj</li>
  <li>Avans talepleri ve ödeme durumu</li>
  <li>Kesintiler</li>
  <li>Asgari ücret / tam gün takibi</li>
  <li>QR yoklama kayıtları</li>
  <li>Mesai (fazla çalışma) onayları</li>
</ul>
<p>Amaç, finansal takibin rahat, dijital ve karşılıklı görünür olmasıdır; taraflar arasında bilgi asimetrisini azaltmaktır.</p>

<h2>4. YÖNETİCİ VE PERSONEL ROLLERİ</h2>
<p><strong>Yönetici</strong> (platformu kullanan kişi): Proje oluşturur, personel kaydı onaylar, yevmiye/avans/kesinti girer. Sahadaki fiili yönetim ve ödeme yükümlülükleri kendisine aittir; {{DEVELOPER_NAME}} bu yükümlülükleri devralmaz.</p>
<p><strong>Personel</strong>: Kendi panelinden kayıtlarını görür, itiraz edebilir, avans talep edebilir, yoklama yapabilir. Girdiği kimlik bilgilerinin doğruluğundan sorumludur.</p>

<h2>5. &quot;OLDUĞU GİBİ&quot; SUNUM</h2>
<p>Platform ücretsiz ve gönüllülük esasına göre sunulur. Kesintisiz çalışma, veri kaybı olmaması, belirli bir hukuki sonuç doğurması veya süresiz hizmet verilmesi garanti edilmez. Bakım, güncelleme veya projenin sonlandırılması mümkündür.</p>

<h2>6. RESMİ GEÇERLİLİK VE MAHKEME DELİLİ</h2>
<p><strong>6.1.</strong> Platform kayıtları resmi bordro, SGK bildirimi, vergi kaydı veya e-Devlet belgesi değildir.</p>
<p><strong>6.2.</strong> İş hukuku uyuşmazlıklarında öncelik; resmi işveren kayıtları, imzalı bordro, banka dekontları, tanık beyanları ve mevzuata uygun belgelere aittir.</p>
<p><strong>6.3.</strong> Elektronik sözleşme onayı, OTP doğrulama ve sistem logları 6098 sayılı TBK ve 6100 sayılı HMK çerçevesinde <em>destekleyici delil</em> niteliğinde olabilir; tek başına kesin ve bağlayıcı delil olduğu garanti edilmez.</p>
<p><strong>6.4.</strong> Sistemdeki yevmiye, avans ve kesinti kayıtları taraflar arası şeffaflık ve mutabakat amacı taşır; mahkemede tek başına hakediş belgesi veya icra emrine dayanak olduğu iddia edilmez.</p>
<p><strong>6.5.</strong> T.C. kimlik numarası yalnızca algoritmik format kontrolünden geçer; NVI/KPS ile resmi kimlik doğrulaması yapılmaz.</p>

<h2>7. SORUMLULUK SINIRI</h2>
<p>{{DEVELOPER_NAME}}, platform operatörü sıfatıyla; kullanıcıların girdiği verilerin doğruluğu, yöneticiler ile personel arasındaki özel hukuk uyuşmazlıkları, ödenmeyen ücret, yanlış kesinti, iş kazası veya İSG ihlallerinden doğrudan sorumlu tutulamaz.</p>

<h2>8. FİKRİ MÜLKİYET</h2>
<p>Yazılım, arayüz ve marka unsurları {{DEVELOPER_NAME}}'a aittir. İzinsiz ticari çoğaltma veya satış yapılamaz.</p>

<h2>9. ELEKTRONİK ONAY</h2>
<p>Personel; işbu metni okuduğunu, platformun gönüllülük niteliğini ve resmi geçerlilik sınırlarını anladığını, özgür iradesiyle kabul ettiğini beyan eder. Onay anına ilişkin tarih-saat, sürüm numarası ve teknik kayıtlar saklanır.</p>
$html$,
  1,
  true,
  1
),
(
  'kvkk-aydinlatma',
  'KVKK Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni',
  'Kişisel verilerinizin hangi amaçlarla işlendiğini, veri sorumlusu/operatör ayrımını ve KVKK m.11 haklarınızı okuduğunuzu onaylarsınız.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Platform operatörü (teknik):</strong> {{DEVELOPER_NAME}} — {{PLATFORM_CONTACT}}</p>
  <p><strong>Not:</strong> {{COMPANY_LEGAL_NAME}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> KVKK m.10 aydınlatma metni</p>
  <p><strong>Yasal dayanak:</strong> 6698 sayılı KVKK</p>
</div>

<h2>1. VERİ SORUMLUSU YAPISI</h2>
<p>{{PLATFORM_NAME}} tüzel kişiliği yoktur. Personel kaydı, pratikte <strong>platformu kullanan yönetici kişi</strong> (şantiye sorumlusu, ekip başı vb.) tarafından oluşturulur; iş ilişkisinin tarafı olan gerçek işveren/yüklenici mevzuat uyarınca ayrı veri sorumlusu olabilir.</p>
<p><strong>Platform operatörü / veri işleyen:</strong> {{DEVELOPER_NAME}} — altyapı, barındırma, şifreleme ve yazılım hizmeti sunar.</p>

<h2>2. İŞLENEN VERİLER</h2>
<ul>
  <li>Kimlik: ad-soyad, T.C. kimlik no (format kontrolü; NVI doğrulaması yok), doğum tarihi</li>
  <li>İletişim: telefon, e-posta</li>
  <li>Finans: IBAN, yevmiye, avans, kesinti kayıtları</li>
  <li>Operasyon: puantaj, yoklama, mesai, proje bilgisi</li>
  <li>Görsel: başvuru fotoğrafı</li>
  <li>İşlem güvenliği: oturum, onay logları</li>
</ul>

<h2>3. AMAÇLAR VE HUKUKİ SEBEPLER</h2>
<p>Veriler; dijital personel takibi, şeffaf finansal kayıt, yoklama, sözleşme onayı, güvenlik ve teknik destek amacıyla; açık rıza, sözleşmenin ifası ve meşru menfaat kapsamında işlenir. Ticari pazarlama veya veri satışı yapılmaz.</p>

<h2>4. AKTARIM</h2>
<p>Barındırma (Vercel), veritabanı (Supabase), e-posta (Brevo), isteğe bağlı OCR (Google Cloud) hizmet sağlayıcıları; yasal zorunluluk halinde resmi makamlar.</p>

<h2>5. GÜVENLİK</h2>
<p>T.C. kimlik, IBAN ve doğum tarihi AES-256-GCM ile şifrelenir. HTTPS ve rol tabanlı erişim uygulanır.</p>

<h2>6. HAKLARINIZ (KVKK m.11)</h2>
<p>Bilgi talebi, düzeltme, silme, itiraz ve KVKK Kurulu'na şikâyet haklarınız vardır. Başvuru: önce kaydı oluşturan yönetici; teknik konularda {{PLATFORM_CONTACT}}.</p>

<h2>7. ONAY</h2>
<p>Personel; aydınlatma metnini okuduğunu ve anladığını elektronik ortamda onaylar.</p>
$html$,
  4,
  true,
  2
),
(
  'gizlilik-veri',
  'Kişisel Veriler Açık Rıza, Gizlilik ve Bilgi Güvenliği Taahhütnamesi',
  'Kişisel verilerinizin işlenmesine açık rıza verir; platformun gönüllülük niteliğini ve gizlilik kurallarını kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Operatör:</strong> {{DEVELOPER_NAME}} — {{PLATFORM_CONTACT}}</p>
</div>

<h2>1. AMAÇ</h2>
<p>6698 sayılı KVKK uyarınca kişisel verilerin güvenli işlenmesi, gizliliğin korunması ve hukuka aykırı kullanımın önlenmesi amacıyla düzenlenmiştir. Platform gönüllülük esaslıdır; tüzel kişiliği yoktur.</p>

<h2>2. AÇIK RIZA KAPSAMI</h2>
<p>Personel; KVKK Aydınlatma Metni'ni okuduğunu teyit ederek kimlik, iletişim, finans (IBAN), özlük/saha (yevmiye, puantaj, avans, kesinti) ve başvuru fotoğrafının platformda işlenmesine, saklanmasına ve teknik altyapı sağlayıcılarına aktarılmasına <strong>açık rıza</strong> verir.</p>

<h2>3. GİZLİLİK</h2>
<p>Personel, sahadaki diğer çalışanlara ve iş süreçlerine dair öğrendiği verileri izinsiz paylaşmaz. Yönetici de personel verilerini platform dışında kötüye kullanmamayı taahhüt eder.</p>

<h2>4. SAKLAMA VE SİLME</h2>
<p>Veriler işleme amacının gerektirdiği süre boyunca saklanır. Personel, KVKK m.11 kapsamında silme/düzeltme talebinde bulunabilir.</p>

<h2>5. BEYAN</h2>
<p>Personel; girdiği T.C. kimlik ve IBAN bilgilerinin kendisine ait olduğunu veya kullanım yetkisine sahip olduğunu; sahte bilgi vermenin hukuki sonuçlarından sorumlu olduğunu kabul eder.</p>
$html$,
  4,
  true,
  3
),
(
  'finansal-seffaflik',
  'Finansal Kayıt, Yevmiye ve Şeffaflık Bildirimi',
  'Yevmiye, avans, kesinti ve puantaj kayıtlarının çift taraflı görünürlüğünü; resmi bordro yerine geçmediğini kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Geliştirici:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. ŞEFFAFLIK İLKESİ</h2>
<p>{{PLATFORM_NAME}}'de işlenen finansal kayıtlar — yevmiye, avans, kesinti, asgari ücret takibi, mesai — <strong>hem yönetici hem personel panelinde</strong> görüntülenebilir. Amaç, taraflar arasında adil ve dijital bir finansal takip sağlamaktır.</p>

<h2>2. YEVMİYE VE PUANTAJ</h2>
<p>Çalışılan günler, mesai ve eksik günler dijital puantaj ile kaydedilir. Günlük yevmiye tutarı yönetici onayı ile sisteme işlenir; personel panelinden takip edilebilir.</p>

<h2>3. AVANS VE KESİNTİ</h2>
<p>Avans talepleri, onay durumu ve kesintiler kayıt altındadır. Personel, kendi kayıtlarını görüntüleyebilir ve itiraz mekanizmalarını kullanabilir.</p>

<h2>4. RESMİ BELGE OLMAYIŞI</h2>
<p><strong>Önemli:</strong> Bu kayıtlar resmi bordro, SGK bildirimi veya vergi belgesi değildir. İş hukuku uyuşmazlıklarında resmi kayıtlar önceliklidir. Platform kayıtları destekleyici nitelikte olabilir; kesin delil olduğu garanti edilmez.</p>

<h2>5. IBAN VE ÖDEME</h2>
<p>Ödemeler personelin beyan ettiği IBAN üzerinden yönetici tarafından fiilen yapılır. Platform ödeme aracısı değildir; banka dekontu resmi ödeme kanıtıdır.</p>

<h2>6. ONAY</h2>
<p>Personel; finansal kayıtların şeffaf işlendiğini, platformun resmi bordro yerine geçmediğini ve kayıtların bilgilendirme/mutabakat amaçlı olduğunu okuyup kabul eder.</p>
$html$,
  1,
  true,
  4
),
(
  'cihaz-izinleri',
  'Cihaz İzinleri, Kamera ve Mobil Uygulama Kullanım Bildirimi',
  'Kamera (QR yoklama), bildirim ve PWA/TWA izinlerinin kullanım amacını; gizli kayıt yapılmadığını kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} · {{PLATFORM_URL}}</p>
  <p><strong>Operatör:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. MOBİL UYGULAMA (PWA / TWA)</h2>
<p>Android uygulamaları (Trusted Web Activity), aynı web platformunu tam ekran gösterir. Ek veri toplama yapılmaz; aynı gizlilik kuralları geçerlidir.</p>

<h2>2. KAMERA İZNİ</h2>
<p>Kamera yalnızca <strong>QR kod yoklama</strong> gibi açık kullanıcı eylemlerinde, cihaz izniyle kullanılır. Arka planda gizli fotoğraf/video kaydı yapılmaz. Kamera görüntüsü sunucuda saklanmaz (QR okuma anlık işlenir).</p>

<h2>3. PROFİL FOTOĞRAFI</h2>
<p>Başvuru sırasında yüklenen fotoğraf kimlik teyidi amacıyla yönetici tarafından manuel incelenir; NVI otomatik doğrulaması yapılmaz.</p>

<h2>4. BİLDİRİM VE ÇEREZLER</h2>
<p>Oturum çerezleri (HttpOnly) kimlik doğrulama için kullanılır. Push bildirim kullanılıyorsa yalnızca işlem hatırlatmaları içindir.</p>

<h2>5. PAYLAŞIM HEDEFİ (DEKONT)</h2>
<p>Yönetici uygulamasında banka dekontu paylaşımı isteğe bağlıdır; yalnızca kullanıcı paylaştığı dosya OCR ile analiz edilir.</p>

<h2>6. ONAY</h2>
<p>Personel; cihaz izinlerinin yukarıdaki amaçlarla sınırlı olduğunu okuduğunu ve kabul ettiğini beyan eder.</p>
$html$,
  1,
  true,
  5
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  content_html = excluded.content_html,
  version = excluded.version,
  sort_order = excluded.sort_order,
  is_required = excluded.is_required,
  updated_at = now();
