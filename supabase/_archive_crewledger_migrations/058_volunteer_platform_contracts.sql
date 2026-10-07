-- =========================================================================================
-- CREWLEDGER PERSONEL SÖZLEŞMELERİ (otomatik üretildi)
-- Kaynak: content/contracts/*.html
-- Üret: npm run contracts:build
-- =========================================================================================

UPDATE public.personnel_contracts
SET is_required = false, updated_at = now()
WHERE slug IN ('ekip-calismasi', 'ucret-yevmiye');

insert into public.personnel_contracts (slug, title, summary, content_html, version, is_required, sort_order)
values
(
  'platform-kullanim',
  'Platform Kullanım Şartları',
  'CrewLedger gönüllük projesidir; kullanım zorunlu değildir. Platformun resmi belge yerine geçmediğini kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} — {{PLATFORM_URL}}</p>
  <p><strong>Geliştirici:</strong> {{DEVELOPER_NAME}}</p>
  <p><strong>İletişim:</strong> {{PLATFORM_CONTACT}}</p>
</div>
<div class="contract-meta">
  <p>Bu metin bir şirket veya resmi işveren adına düzenlenmemiştir. {{PLATFORM_NAME}}, {{DEVELOPER_NAME}} tarafından geliştirilen gönüllük esaslı bir dijital platformdur.</p>
</div>

<h2>1. Platform nedir?</h2>
<p>{{PLATFORM_NAME}}; şantiye ve inşaat ortamlarında yevmiye, avans, kesinti, yoklama ve puantaj takibini dijitalleştirmek için kurulmuş, <strong>kar amacı gütmeyen</strong> bir projedir. Tüzel kişiliği yoktur; e-Devlet, NVI, SGK veya resmi bordro sistemleriyle bağlantılı değildir.</p>

<h2>2. Kullanım gönüllüdür</h2>
<p>Hiç kimse — yönetici, ekip başı veya işveren — sizi bu platformu kullanmaya zorlayamaz. Kullanmak istemezseniz, ücret ve çalışma ilişkiniz sahadaki fiili düzen ve yürürlükteki mevzuata göre ayrıca yürütülür.</p>

<h2>3. Ne işe yarar?</h2>
<p>Platform; aşağıdaki kayıtların tutulmasına ve <strong>hem yönetici hem personel tarafından görülmesine</strong> aracılık eder:</p>
<ul>
  <li>Günlük yevmiye ve puantaj</li>
  <li>Avans talepleri</li>
  <li>Kesintiler</li>
  <li>Asgari ücret / tam gün takibi</li>
  <li>QR ile yoklama</li>
  <li>Mesai onayları</li>
</ul>
<p>Amaç, finansal takibi şeffaf ve dijital hale getirmektir.</p>

<h2>4. Roller</h2>
<p><strong>Yönetici</strong> (platformu açan kişi): Kayıt onaylar, yevmiye ve avans girer. Sahadaki ödeme ve yönetim yükümlülüğü kendisindedir; {{DEVELOPER_NAME}} bu sorumlulukları üstlenmez.</p>
<p><strong>Personel</strong>: Kendi kayıtlarını panelden görür, itiraz edebilir, avans talep edebilir. Girdiği kimlik bilgilerinin doğruluğundan sorumludur.</p>

<h2>5. Hizmet garantisi</h2>
<p>Platform ücretsiz sunulur. Kesintisiz çalışacağı, veri kaybı olmayacağı veya süresiz hizmet verileceği garanti edilmez. Bakım, güncelleme veya projenin kapanması mümkündür.</p>

<h2>6. Resmi geçerlilik</h2>
<p>Bu kayıtlar resmi bordro, SGK bildirimi veya e-Devlet belgesi değildir. İş uyuşmazlıklarında öncelik resmi işveren kayıtları, imzalı bordro, banka dekontları ve mevzuata uygun belgelere aittir.</p>
<p>Elektronik onay ve sistem logları mahkemede <em>destekleyici delil</em> olabilir; tek başına kesin delil sayılacağı garanti edilmez. T.C. kimlik numarası yalnızca format kontrolünden geçer; NVI doğrulaması yapılmaz.</p>

<h2>7. Sorumluluk</h2>
<p>{{DEVELOPER_NAME}}, kullanıcıların girdiği yanlış verilerden, ödenmeyen ücretten, iş kazasından veya yönetici–personel arasındaki özel uyuşmazlıklardan doğrudan sorumlu tutulamaz.</p>

<h2>8. Onayınız</h2>
<p>Bu metni okuduğunuzu, platformun gönüllülük niteliğini anladığınızı ve özgür iradenizle kabul ettiğinizi beyan edersiniz. Onay tarihi, sürüm numarası ve teknik kayıtlar saklanır.</p>
$html$,
  2,
  true,
  1
),
(
  'kvkk-aydinlatma',
  'KVKK Aydınlatma Metni',
  'Kişisel verilerinizin hangi amaçla işlendiği, kimlerin sorumlu olduğu ve haklarınız hakkında bilgilendirilirsiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Teknik operatör:</strong> {{DEVELOPER_NAME}} — {{PLATFORM_CONTACT}}</p>
</div>

<h2>1. Kim veri sorumlusu?</h2>
<p>{{PLATFORM_NAME}}'in tüzel kişiliği yoktur. Personel kaydını pratikte <strong>platformu kullanan yönetici</strong> (şantiye sorumlusu, ekip başı vb.) oluşturur. İş ilişkisinin asıl tarafı olan işveren/yüklenici, mevzuat gereği ayrı veri sorumlusu olabilir.</p>
<p>{{DEVELOPER_NAME}}, altyapı, barındırma ve yazılım hizmeti sunan <strong>teknik operatör / veri işleyen</strong> konumundadır.</p>

<h2>2. Hangi veriler işlenir?</h2>
<ul>
  <li>Kimlik: ad-soyad, T.C. kimlik no, doğum tarihi</li>
  <li>İletişim: telefon, e-posta</li>
  <li>Finans: IBAN, yevmiye, avans, kesinti</li>
  <li>Operasyon: puantaj, yoklama, mesai</li>
  <li>Görsel: başvuru fotoğrafı</li>
  <li>Güvenlik: oturum ve onay logları</li>
</ul>

<h2>3. Neden işlenir?</h2>
<p>Dijital personel takibi, şeffaf finansal kayıt, yoklama, sözleşme onayı ve platform güvenliği için. Veriler satılmaz veya reklam amacıyla profillenmez.</p>

<h2>4. Kimlerle paylaşılır?</h2>
<p>Yalnızca hizmet için gerekli teknik sağlayıcılar (barındırma, veritabanı, e-posta) ve yasal zorunluluk halinde resmi makamlar.</p>

<h2>5. Nasıl korunur?</h2>
<p>T.C. kimlik, IBAN ve doğum tarihi şifreli saklanır. Erişim HTTPS ve rol bazlı yetkilendirme ile sınırlıdır.</p>

<h2>6. Haklarınız</h2>
<p>6698 sayılı KVKK kapsamında bilgi talep etme, düzeltme, silme ve itiraz haklarınız vardır. Önce kaydı oluşturan yöneticinize; teknik konularda {{PLATFORM_CONTACT}} adresine yazabilirsiniz.</p>

<h2>7. Onay</h2>
<p>Bu aydınlatma metnini okuduğunuzu ve anladığınızı onaylarsınız.</p>
$html$,
  5,
  true,
  2
),
(
  'gizlilik-veri',
  'Açık Rıza ve Gizlilik Taahhüdü',
  'Verilerinizin işlenmesine rıza verir; girdiğiniz bilgilerin doğruluğundan sorumlu olduğunuzu kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Operatör:</strong> {{DEVELOPER_NAME}} — {{PLATFORM_CONTACT}}</p>
</div>

<h2>1. Açık rıza</h2>
<p>KVKK Aydınlatma Metni'ni okuduğunuzu teyit ederek; kimlik, iletişim, IBAN, yevmiye/puantaj/avans/kesinti kayıtları ve başvuru fotoğrafınızın platformda işlenmesine, saklanmasına ve teknik altyapı sağlayıcılarına aktarılmasına <strong>açık rıza</strong> verirsiniz.</p>

<h2>2. Gizlilik</h2>
<p>Sahada öğrendiğiniz diğer çalışanlara veya iş süreçlerine dair bilgileri izinsiz paylaşmazsınız. Yönetici de personel verilerini platform dışında kötüye kullanmamayı taahhüt eder.</p>

<h2>3. Saklama ve silme</h2>
<p>Veriler, işleme amacının gerektirdiği süre boyunca tutulur. KVKK kapsamında silme veya düzeltme talebinde bulunabilirsiniz.</p>

<h2>4. Doğruluk beyanı</h2>
<p>Girdiğiniz T.C. kimlik ve IBAN bilgilerinin size ait olduğunu veya kullanım yetkiniz bulunduğunu; sahte bilgi vermenin hukuki sonuçlarından sorumlu olduğunuzu kabul edersiniz.</p>
$html$,
  5,
  true,
  3
),
(
  'finansal-seffaflik',
  'Finansal Kayıt ve Şeffaflık Bildirimi',
  'Yevmiye, avans ve kesintilerin her iki tarafta da görülebileceğini; kayıtların resmi bordro yerine geçmediğini kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Geliştirici:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. Şeffaflık</h2>
<p>Yevmiye, avans, kesinti, asgari ücret takibi ve mesai kayıtları <strong>hem yönetici hem personel panelinde</strong> görülebilir. Amaç, taraflar arasında adil ve açık bir finansal takip sağlamaktır.</p>

<h2>2. Yevmiye ve puantaj</h2>
<p>Çalışılan günler dijital puantajla kaydedilir. Günlük yevmiye tutarı yönetici onayıyla sisteme işlenir; personel panelinden takip edebilirsiniz.</p>

<h2>3. Avans ve kesinti</h2>
<p>Avans talepleri, onay durumu ve kesintiler kayıt altındadır. Kendi kayıtlarınızı görüntüleyebilir, itiraz mekanizmalarını kullanabilirsiniz.</p>

<h2>4. Resmi belge değildir</h2>
<p>Bu kayıtlar resmi bordro, SGK bildirimi veya vergi belgesi yerine geçmez. İş uyuşmazlıklarında resmi kayıtlar önceliklidir. Platform kayıtları yalnızca bilgilendirme ve karşılıklı mutabakat amacı taşır.</p>

<h2>5. Ödeme</h2>
<p>Ödemeler yöneticiniz tarafından, beyan ettiğiniz IBAN'a fiilen yapılır. Platform ödeme aracısı değildir; banka dekontu resmi ödeme kanıtıdır.</p>

<h2>6. Onay</h2>
<p>Finansal kayıtların bu şekilde işlendiğini ve platformun resmi bordro yerine geçmediğini okuyup kabul edersiniz.</p>
$html$,
  2,
  true,
  4
),
(
  'cihaz-izinleri',
  'Cihaz İzinleri Bildirimi',
  'Kamera (QR yoklama), oturum çerezleri ve mobil uygulama kullanımına ilişkin bilgilendirme.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} — {{PLATFORM_URL}}</p>
  <p><strong>Operatör:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. Mobil uygulama</h2>
<p>Android uygulamaları (TWA), aynı web sitesini tam ekran gösterir. Ek veri toplama yapılmaz.</p>

<h2>2. Kamera</h2>
<p>Kamera yalnızca <strong>QR yoklama</strong> gibi sizin başlattığınız işlemlerde, cihaz izniyle kullanılır. Arka planda gizli kayıt yapılmaz; görüntü sunucuda saklanmaz.</p>

<h2>3. Profil fotoğrafı</h2>
<p>Başvuruda yüklediğiniz fotoğraf yönetici tarafından manuel incelenir. Otomatik kimlik doğrulaması yapılmaz.</p>

<h2>4. Çerezler ve bildirimler</h2>
<p>Oturum çerezleri (HttpOnly) giriş güvenliği içindir. Bildirim varsa yalnızca işlem hatırlatmaları içerir.</p>

<h2>5. Dekont paylaşımı (yönetici)</h2>
<p>Yönetici uygulamasında banka dekontu paylaşımı isteğe bağlıdır; yalnızca sizin paylaştığınız dosya analiz edilir.</p>

<h2>6. Onay</h2>
<p>Cihaz izinlerinin yalnızca yukarıdaki amaçlarla kullanıldığını okuyup kabul edersiniz.</p>
$html$,
  2,
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
