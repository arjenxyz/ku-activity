UPDATE public.personnel_contracts
SET is_required = false, updated_at = now()
WHERE slug IN ('ekip-calismasi', 'ucret-yevmiye');

insert into public.personnel_contracts (slug, title, summary, content_html, version, is_required, sort_order)
values
(
  'platform-kullanim',
  'Platform KullanÄ±m ÅartlarÄ± ve GÃ¶nÃ¼llÃ¼lÃ¼k BeyanÄ±',
  'CrewLedger''in gÃ¶nÃ¼llÃ¼lÃ¼k projesi olduÄŸunu, ÅŸirkete baÄŸlÄ± olmadÄ±ÄŸÄ±nÄ±, kullanÄ±mÄ±n zorunlu olmadÄ±ÄŸÄ±nÄ± ve mahkeme/resmi geÃ§erlilik sÄ±nÄ±rlarÄ±nÄ± kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} â€” {{PLATFORM_URL}}</p>
  <p><strong>Nitelik:</strong> {{PLATFORM_NATURE}} (tÃ¼zel kiÅŸilik yoktur)</p>
  <p><strong>GeliÅŸtirici / OperatÃ¶r:</strong> {{DEVELOPER_NAME}} ({{DEVELOPER_ROLE}})</p>
  <p><strong>Ä°letiÅŸim:</strong> {{PLATFORM_CONTACT}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge tÃ¼rÃ¼:</strong> Platform kullanÄ±m ÅŸartlarÄ± ve gÃ¶nÃ¼llÃ¼lÃ¼k beyanÄ±</p>
  <p><strong>Ã–nemli:</strong> Bu metin herhangi bir anonim ÅŸirket, taÅŸeron firmasÄ± veya resmi iÅŸveren adÄ±na dÃ¼zenlenmemiÅŸtir.</p>
</div>

<h2>1. PLATFORMUN TANIMI</h2>
<p><strong>{{PLATFORM_NAME}}</strong>, {{DEVELOPER_NAME}} tarafÄ±ndan geliÅŸtirilen, inÅŸaat ve ÅŸantiye ortamlarÄ±nda personel finansal takibini dijitalleÅŸtirmeyi amaÃ§layan <strong>kar amacÄ± gÃ¼tmeyen gÃ¶nÃ¼llÃ¼lÃ¼k projesidir</strong>. Platform ticari bir iÅŸletme deÄŸildir; herhangi bir ÅŸirketin mÃ¼lkiyetinde veya resmi temsilinde deÄŸildir.</p>
<p>Platform; e-Devlet, NVI/KPS/Mernis, SGK veya resmi bordro sistemleri ile entegre deÄŸildir. Resmi devlet kayÄ±tlarÄ±nÄ±n yerine geÃ§mez.</p>

<h2>2. GÃ–NÃœLLÃœ KULLANIM â€” ZORUNLULUK YOK</h2>
<p>HiÃ§bir yÃ¶netici, ekip baÅŸÄ±, ÅŸantiye sorumlusu veya iÅŸveren, personeli bu platformu kullanmaya <strong>zorlayamaz</strong>. Personel kaydÄ± ve kullanÄ±m tamamen gÃ¶nÃ¼llÃ¼dÃ¼r.</p>
<p>Platformu kullanmayÄ± reddeden personel ile taraflar arasÄ±ndaki Ã¼cret, Ã§alÄ±ÅŸma ve Ä°SG iliÅŸkisi ilgili mevzuat ve sahadaki fiili dÃ¼zenlemelere gÃ¶re ayrÄ±ca yÃ¼rÃ¼tÃ¼lÃ¼r.</p>

<h2>3. HÄ°ZMETÄ°N KAPSAMI VE ÅEFFAFLIK</h2>
<p>Platform aÅŸaÄŸÄ±daki kayÄ±tlarÄ±n dijital ortamda tutulmasÄ±na ve <strong>hem yÃ¶netici hem personel tarafÄ±ndan gÃ¶rÃ¼ntÃ¼lenmesine</strong> aracÄ±lÄ±k eder:</p>
<ul>
  <li>GÃ¼nlÃ¼k yevmiye ve puantaj</li>
  <li>Avans talepleri ve Ã¶deme durumu</li>
  <li>Kesintiler</li>
  <li>Asgari Ã¼cret / tam gÃ¼n takibi</li>
  <li>QR yoklama kayÄ±tlarÄ±</li>
  <li>Mesai (fazla Ã§alÄ±ÅŸma) onaylarÄ±</li>
</ul>
<p>AmaÃ§, finansal takibin rahat, dijital ve karÅŸÄ±lÄ±klÄ± gÃ¶rÃ¼nÃ¼r olmasÄ±dÄ±r; taraflar arasÄ±nda bilgi asimetrisini azaltmaktÄ±r.</p>

<h2>4. YÃ–NETÄ°CÄ° VE PERSONEL ROLLERÄ°</h2>
<p><strong>YÃ¶netici</strong> (platformu kullanan kiÅŸi): Proje oluÅŸturur, personel kaydÄ± onaylar, yevmiye/avans/kesinti girer. Sahadaki fiili yÃ¶netim ve Ã¶deme yÃ¼kÃ¼mlÃ¼lÃ¼kleri kendisine aittir; {{DEVELOPER_NAME}} bu yÃ¼kÃ¼mlÃ¼lÃ¼kleri devralmaz.</p>
<p><strong>Personel</strong>: Kendi panelinden kayÄ±tlarÄ±nÄ± gÃ¶rÃ¼r, itiraz edebilir, avans talep edebilir, yoklama yapabilir. GirdiÄŸi kimlik bilgilerinin doÄŸruluÄŸundan sorumludur.</p>

<h2>5. &quot;OLDUÄU GÄ°BÄ°&quot; SUNUM</h2>
<p>Platform Ã¼cretsiz ve gÃ¶nÃ¼llÃ¼lÃ¼k esasÄ±na gÃ¶re sunulur. Kesintisiz Ã§alÄ±ÅŸma, veri kaybÄ± olmamasÄ±, belirli bir hukuki sonuÃ§ doÄŸurmasÄ± veya sÃ¼resiz hizmet verilmesi garanti edilmez. BakÄ±m, gÃ¼ncelleme veya projenin sonlandÄ±rÄ±lmasÄ± mÃ¼mkÃ¼ndÃ¼r.</p>

<h2>6. RESMÄ° GEÃ‡ERLÄ°LÄ°K VE MAHKEME DELÄ°LÄ°</h2>
<p><strong>6.1.</strong> Platform kayÄ±tlarÄ± resmi bordro, SGK bildirimi, vergi kaydÄ± veya e-Devlet belgesi deÄŸildir.</p>
<p><strong>6.2.</strong> Ä°ÅŸ hukuku uyuÅŸmazlÄ±klarÄ±nda Ã¶ncelik; resmi iÅŸveren kayÄ±tlarÄ±, imzalÄ± bordro, banka dekontlarÄ±, tanÄ±k beyanlarÄ± ve mevzuata uygun belgelere aittir.</p>
<p><strong>6.3.</strong> Elektronik sÃ¶zleÅŸme onayÄ±, OTP doÄŸrulama ve sistem loglarÄ± 6098 sayÄ±lÄ± TBK ve 6100 sayÄ±lÄ± HMK Ã§erÃ§evesinde <em>destekleyici delil</em> niteliÄŸinde olabilir; tek baÅŸÄ±na kesin ve baÄŸlayÄ±cÄ± delil olduÄŸu garanti edilmez.</p>
<p><strong>6.4.</strong> Sistemdeki yevmiye, avans ve kesinti kayÄ±tlarÄ± taraflar arasÄ± ÅŸeffaflÄ±k ve mutabakat amacÄ± taÅŸÄ±r; mahkemede tek baÅŸÄ±na hakediÅŸ belgesi veya icra emrine dayanak olduÄŸu iddia edilmez.</p>
<p><strong>6.5.</strong> T.C. kimlik numarasÄ± yalnÄ±zca algoritmik format kontrolÃ¼nden geÃ§er; NVI/KPS ile resmi kimlik doÄŸrulamasÄ± yapÄ±lmaz.</p>

<h2>7. SORUMLULUK SINIRI</h2>
<p>{{DEVELOPER_NAME}}, platform operatÃ¶rÃ¼ sÄ±fatÄ±yla; kullanÄ±cÄ±larÄ±n girdiÄŸi verilerin doÄŸruluÄŸu, yÃ¶neticiler ile personel arasÄ±ndaki Ã¶zel hukuk uyuÅŸmazlÄ±klarÄ±, Ã¶denmeyen Ã¼cret, yanlÄ±ÅŸ kesinti, iÅŸ kazasÄ± veya Ä°SG ihlallerinden doÄŸrudan sorumlu tutulamaz.</p>

<h2>8. FÄ°KRÄ° MÃœLKÄ°YET</h2>
<p>YazÄ±lÄ±m, arayÃ¼z ve marka unsurlarÄ± {{DEVELOPER_NAME}}'a aittir. Ä°zinsiz ticari Ã§oÄŸaltma veya satÄ±ÅŸ yapÄ±lamaz.</p>

<h2>9. ELEKTRONÄ°K ONAY</h2>
<p>Personel; iÅŸbu metni okuduÄŸunu, platformun gÃ¶nÃ¼llÃ¼lÃ¼k niteliÄŸini ve resmi geÃ§erlilik sÄ±nÄ±rlarÄ±nÄ± anladÄ±ÄŸÄ±nÄ±, Ã¶zgÃ¼r iradesiyle kabul ettiÄŸini beyan eder. Onay anÄ±na iliÅŸkin tarih-saat, sÃ¼rÃ¼m numarasÄ± ve teknik kayÄ±tlar saklanÄ±r.</p>
$html$,
  1,
  true,
  1
),
(
  'kvkk-aydinlatma',
  'KVKK KiÅŸisel Verilerin Ä°ÅŸlenmesine Ä°liÅŸkin AydÄ±nlatma Metni',
  'KiÅŸisel verilerinizin hangi amaÃ§larla iÅŸlendiÄŸini, veri sorumlusu/operatÃ¶r ayrÄ±mÄ±nÄ± ve KVKK m.11 haklarÄ±nÄ±zÄ± okuduÄŸunuzu onaylarsÄ±nÄ±z.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>Platform operatÃ¶rÃ¼ (teknik):</strong> {{DEVELOPER_NAME}} â€” {{PLATFORM_CONTACT}}</p>
  <p><strong>Not:</strong> {{COMPANY_LEGAL_NAME}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge tÃ¼rÃ¼:</strong> KVKK m.10 aydÄ±nlatma metni</p>
  <p><strong>Yasal dayanak:</strong> 6698 sayÄ±lÄ± KVKK</p>
</div>

<h2>1. VERÄ° SORUMLUSU YAPISI</h2>
<p>{{PLATFORM_NAME}} tÃ¼zel kiÅŸiliÄŸi yoktur. Personel kaydÄ±, pratikte <strong>platformu kullanan yÃ¶netici kiÅŸi</strong> (ÅŸantiye sorumlusu, ekip baÅŸÄ± vb.) tarafÄ±ndan oluÅŸturulur; iÅŸ iliÅŸkisinin tarafÄ± olan gerÃ§ek iÅŸveren/yÃ¼klenici mevzuat uyarÄ±nca ayrÄ± veri sorumlusu olabilir.</p>
<p><strong>Platform operatÃ¶rÃ¼ / veri iÅŸleyen:</strong> {{DEVELOPER_NAME}} â€” altyapÄ±, barÄ±ndÄ±rma, ÅŸifreleme ve yazÄ±lÄ±m hizmeti sunar.</p>

<h2>2. Ä°ÅLENEN VERÄ°LER</h2>
<ul>
  <li>Kimlik: ad-soyad, T.C. kimlik no (format kontrolÃ¼; NVI doÄŸrulamasÄ± yok), doÄŸum tarihi</li>
  <li>Ä°letiÅŸim: telefon, e-posta</li>
  <li>Finans: IBAN, yevmiye, avans, kesinti kayÄ±tlarÄ±</li>
  <li>Operasyon: puantaj, yoklama, mesai, proje bilgisi</li>
  <li>GÃ¶rsel: baÅŸvuru fotoÄŸrafÄ±</li>
  <li>Ä°ÅŸlem gÃ¼venliÄŸi: oturum, onay loglarÄ±</li>
</ul>

<h2>3. AMAÃ‡LAR VE HUKUKÄ° SEBEPLER</h2>
<p>Veriler; dijital personel takibi, ÅŸeffaf finansal kayÄ±t, yoklama, sÃ¶zleÅŸme onayÄ±, gÃ¼venlik ve teknik destek amacÄ±yla; aÃ§Ä±k rÄ±za, sÃ¶zleÅŸmenin ifasÄ± ve meÅŸru menfaat kapsamÄ±nda iÅŸlenir. Ticari pazarlama veya veri satÄ±ÅŸÄ± yapÄ±lmaz.</p>

<h2>4. AKTARIM</h2>
<p>BarÄ±ndÄ±rma (Vercel), veritabanÄ± (Supabase), e-posta (Brevo), isteÄŸe baÄŸlÄ± OCR (Google Cloud) hizmet saÄŸlayÄ±cÄ±larÄ±; yasal zorunluluk halinde resmi makamlar.</p>

<h2>5. GÃœVENLÄ°K</h2>
<p>T.C. kimlik, IBAN ve doÄŸum tarihi AES-256-GCM ile ÅŸifrelenir. HTTPS ve rol tabanlÄ± eriÅŸim uygulanÄ±r.</p>

<h2>6. HAKLARINIZ (KVKK m.11)</h2>
<p>Bilgi talebi, dÃ¼zeltme, silme, itiraz ve KVKK Kurulu'na ÅŸikÃ¢yet haklarÄ±nÄ±z vardÄ±r. BaÅŸvuru: Ã¶nce kaydÄ± oluÅŸturan yÃ¶netici; teknik konularda {{PLATFORM_CONTACT}}.</p>

<h2>7. ONAY</h2>
<p>Personel; aydÄ±nlatma metnini okuduÄŸunu ve anladÄ±ÄŸÄ±nÄ± elektronik ortamda onaylar.</p>
$html$,
  4,
  true,
  2
),
(
  'gizlilik-veri',
  'KiÅŸisel Veriler AÃ§Ä±k RÄ±za, Gizlilik ve Bilgi GÃ¼venliÄŸi TaahhÃ¼tnamesi',
  'KiÅŸisel verilerinizin iÅŸlenmesine aÃ§Ä±k rÄ±za verir; platformun gÃ¶nÃ¼llÃ¼lÃ¼k niteliÄŸini ve gizlilik kurallarÄ±nÄ± kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>OperatÃ¶r:</strong> {{DEVELOPER_NAME}} â€” {{PLATFORM_CONTACT}}</p>
</div>

<h2>1. AMAÃ‡</h2>
<p>6698 sayÄ±lÄ± KVKK uyarÄ±nca kiÅŸisel verilerin gÃ¼venli iÅŸlenmesi, gizliliÄŸin korunmasÄ± ve hukuka aykÄ±rÄ± kullanÄ±mÄ±n Ã¶nlenmesi amacÄ±yla dÃ¼zenlenmiÅŸtir. Platform gÃ¶nÃ¼llÃ¼lÃ¼k esaslÄ±dÄ±r; tÃ¼zel kiÅŸiliÄŸi yoktur.</p>

<h2>2. AÃ‡IK RIZA KAPSAMI</h2>
<p>Personel; KVKK AydÄ±nlatma Metni'ni okuduÄŸunu teyit ederek kimlik, iletiÅŸim, finans (IBAN), Ã¶zlÃ¼k/saha (yevmiye, puantaj, avans, kesinti) ve baÅŸvuru fotoÄŸrafÄ±nÄ±n platformda iÅŸlenmesine, saklanmasÄ±na ve teknik altyapÄ± saÄŸlayÄ±cÄ±larÄ±na aktarÄ±lmasÄ±na <strong>aÃ§Ä±k rÄ±za</strong> verir.</p>

<h2>3. GÄ°ZLÄ°LÄ°K</h2>
<p>Personel, sahadaki diÄŸer Ã§alÄ±ÅŸanlara ve iÅŸ sÃ¼reÃ§lerine dair Ã¶ÄŸrendiÄŸi verileri izinsiz paylaÅŸmaz. YÃ¶netici de personel verilerini platform dÄ±ÅŸÄ±nda kÃ¶tÃ¼ye kullanmamayÄ± taahhÃ¼t eder.</p>

<h2>4. SAKLAMA VE SÄ°LME</h2>
<p>Veriler iÅŸleme amacÄ±nÄ±n gerektirdiÄŸi sÃ¼re boyunca saklanÄ±r. Personel, KVKK m.11 kapsamÄ±nda silme/dÃ¼zeltme talebinde bulunabilir.</p>

<h2>5. BEYAN</h2>
<p>Personel; girdiÄŸi T.C. kimlik ve IBAN bilgilerinin kendisine ait olduÄŸunu veya kullanÄ±m yetkisine sahip olduÄŸunu; sahte bilgi vermenin hukuki sonuÃ§larÄ±ndan sorumlu olduÄŸunu kabul eder.</p>
$html$,
  4,
  true,
  3
),
(
  'finansal-seffaflik',
  'Finansal KayÄ±t, Yevmiye ve ÅeffaflÄ±k Bildirimi',
  'Yevmiye, avans, kesinti ve puantaj kayÄ±tlarÄ±nÄ±n Ã§ift taraflÄ± gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼nÃ¼; resmi bordro yerine geÃ§mediÄŸini kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}}</p>
  <p><strong>GeliÅŸtirici:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. ÅEFFAFLIK Ä°LKESÄ°</h2>
<p>{{PLATFORM_NAME}}'de iÅŸlenen finansal kayÄ±tlar â€” yevmiye, avans, kesinti, asgari Ã¼cret takibi, mesai â€” <strong>hem yÃ¶netici hem personel panelinde</strong> gÃ¶rÃ¼ntÃ¼lenebilir. AmaÃ§, taraflar arasÄ±nda adil ve dijital bir finansal takip saÄŸlamaktÄ±r.</p>

<h2>2. YEVMÄ°YE VE PUANTAJ</h2>
<p>Ã‡alÄ±ÅŸÄ±lan gÃ¼nler, mesai ve eksik gÃ¼nler dijital puantaj ile kaydedilir. GÃ¼nlÃ¼k yevmiye tutarÄ± yÃ¶netici onayÄ± ile sisteme iÅŸlenir; personel panelinden takip edilebilir.</p>

<h2>3. AVANS VE KESÄ°NTÄ°</h2>
<p>Avans talepleri, onay durumu ve kesintiler kayÄ±t altÄ±ndadÄ±r. Personel, kendi kayÄ±tlarÄ±nÄ± gÃ¶rÃ¼ntÃ¼leyebilir ve itiraz mekanizmalarÄ±nÄ± kullanabilir.</p>

<h2>4. RESMÄ° BELGE OLMAYIÅI</h2>
<p><strong>Ã–nemli:</strong> Bu kayÄ±tlar resmi bordro, SGK bildirimi veya vergi belgesi deÄŸildir. Ä°ÅŸ hukuku uyuÅŸmazlÄ±klarÄ±nda resmi kayÄ±tlar Ã¶nceliklidir. Platform kayÄ±tlarÄ± destekleyici nitelikte olabilir; kesin delil olduÄŸu garanti edilmez.</p>

<h2>5. IBAN VE Ã–DEME</h2>
<p>Ã–demeler personelin beyan ettiÄŸi IBAN Ã¼zerinden yÃ¶netici tarafÄ±ndan fiilen yapÄ±lÄ±r. Platform Ã¶deme aracÄ±sÄ± deÄŸildir; banka dekontu resmi Ã¶deme kanÄ±tÄ±dÄ±r.</p>

<h2>6. ONAY</h2>
<p>Personel; finansal kayÄ±tlarÄ±n ÅŸeffaf iÅŸlendiÄŸini, platformun resmi bordro yerine geÃ§mediÄŸini ve kayÄ±tlarÄ±n bilgilendirme/mutabakat amaÃ§lÄ± olduÄŸunu okuyup kabul eder.</p>
$html$,
  1,
  true,
  4
),
(
  'cihaz-izinleri',
  'Cihaz Ä°zinleri, Kamera ve Mobil Uygulama KullanÄ±m Bildirimi',
  'Kamera (QR yoklama), bildirim ve PWA/TWA izinlerinin kullanÄ±m amacÄ±nÄ±; gizli kayÄ±t yapÄ±lmadÄ±ÄŸÄ±nÄ± kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Platform:</strong> {{PLATFORM_NAME}} Â· {{PLATFORM_URL}}</p>
  <p><strong>OperatÃ¶r:</strong> {{DEVELOPER_NAME}}</p>
</div>

<h2>1. MOBÄ°L UYGULAMA (PWA / TWA)</h2>
<p>Android uygulamalarÄ± (Trusted Web Activity), aynÄ± web platformunu tam ekran gÃ¶sterir. Ek veri toplama yapÄ±lmaz; aynÄ± gizlilik kurallarÄ± geÃ§erlidir.</p>

<h2>2. KAMERA Ä°ZNÄ°</h2>
<p>Kamera yalnÄ±zca <strong>QR kod yoklama</strong> gibi aÃ§Ä±k kullanÄ±cÄ± eylemlerinde, cihaz izniyle kullanÄ±lÄ±r. Arka planda gizli fotoÄŸraf/video kaydÄ± yapÄ±lmaz. Kamera gÃ¶rÃ¼ntÃ¼sÃ¼ sunucuda saklanmaz (QR okuma anlÄ±k iÅŸlenir).</p>

<h2>3. PROFÄ°L FOTOÄRAFI</h2>
<p>BaÅŸvuru sÄ±rasÄ±nda yÃ¼klenen fotoÄŸraf kimlik teyidi amacÄ±yla yÃ¶netici tarafÄ±ndan manuel incelenir; NVI otomatik doÄŸrulamasÄ± yapÄ±lmaz.</p>

<h2>4. BÄ°LDÄ°RÄ°M VE Ã‡EREZLER</h2>
<p>Oturum Ã§erezleri (HttpOnly) kimlik doÄŸrulama iÃ§in kullanÄ±lÄ±r. Push bildirim kullanÄ±lÄ±yorsa yalnÄ±zca iÅŸlem hatÄ±rlatmalarÄ± iÃ§indir.</p>

<h2>5. PAYLAÅIM HEDEFÄ° (DEKONT)</h2>
<p>YÃ¶netici uygulamasÄ±nda banka dekontu paylaÅŸÄ±mÄ± isteÄŸe baÄŸlÄ±dÄ±r; yalnÄ±zca kullanÄ±cÄ± paylaÅŸtÄ±ÄŸÄ± dosya OCR ile analiz edilir.</p>

<h2>6. ONAY</h2>
<p>Personel; cihaz izinlerinin yukarÄ±daki amaÃ§larla sÄ±nÄ±rlÄ± olduÄŸunu okuduÄŸunu ve kabul ettiÄŸini beyan eder.</p>
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
