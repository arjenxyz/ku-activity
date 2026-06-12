-- =========================================================================================
-- PROJE/ŞANTİYE SAHA EKİP YÖNETİMİ PERSONEL SÖZLEŞMELERİ
-- Hedef Tablo: public.personnel_contracts
-- Mevzuat Uyumu: 6098 s. TBK, 4857 s. İş Kanunu, 6698 s. KVKK, 6331 s. İSG Kanunu
--
-- Çalıştırma: 016_personnel_contracts.sql migration'dan SONRA bu dosyayı Supabase SQL Editor'da çalıştırın.
-- Metin güncellemesi sonrası version artırın; personel yeni sürümü tekrar onaylamak zorunda kalır.
-- =========================================================================================

insert into public.personnel_contracts (slug, title, summary, content_html, version, is_required, sort_order)
values
(
  'ekip-calismasi',
  'Saha Ekip Çalışması, Sevk, İdare ve Görev Kabul Sözleşmesi',
  'Sahada İSG kurallarına uyum, KKD kullanımı, disiplin ve gizlilik yükümlülüklerinizi; çalışma düzeni, fesih ve elektronik onay koşullarını kabul ettiğinizi beyan edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>İşletmeci / Yönetici:</strong> {{COMPANY_LEGAL_NAME}} ({{COMPANY_TRADE_NAME}})</p>
  <p><strong>Adres:</strong> {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}</p>
  <p><strong>Vergi Dairesi / No:</strong> {{COMPANY_TAX_OFFICE}} — {{COMPANY_TAX_ID}}</p>
  <p><strong>İletişim:</strong> {{COMPANY_EMAIL}} · {{COMPANY_PHONE}}</p>
  <p><strong>Yetkili:</strong> {{COMPANY_AUTHORIZED_REP}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> Saha ekip çalışması ve görev kabul sözleşmesi</p>
  <p><strong>Yürürlük:</strong> Elektronik onay anından itibaren</p>
  <p><strong>Not:</strong> Personelin özlük/sigorta kayıtlarının ana yüklenici veya işveren nezdinde tutulması, Yönetici'nin sahada sevk, idare ve disiplin yetkisini ortadan kaldırmaz.</p>
</div>

<h2>1. TARAFLAR VE SÖZLEŞMESEL ARKA PLAN</h2>
<p>İşbu Saha Ekip Çalışması, Sevk, İdare ve Görev Kabul Sözleşmesi ("<strong>Sözleşme</strong>"); bir tarafta şantiye, inşaat, çatı ve muhtelif projelerde saha operasyonlarını yürüten, ekipleri sevk ve idare eden Ekip Başı / Proje Yöneticisi ("<strong>Yönetici</strong>") ile diğer tarafta ilgili sahada görev almayı talep eden, teknik/vasıflı veya vasıfsız iş gücü sağlayan personel ("<strong>Personel</strong>") arasında akdedilmiştir.</p>
<p>Personel; Yönetici'nin saha organizasyonu kapsamında görevlendirildiğini, iş ilişkisinin niteliğinin yürütülen proje, saha düzeni ve mevzuata göre şekillenebileceğini; ana yüklenici/işveren ile Yönetici arasındaki ticari ilişkinin Personel'i doğrudan işveren sıfatına dönüştürmediğini bilerek işbu Sözleşmeyi kabul eder.</p>

<h2>2. SÖZLEŞMENİN KONUSU VE KAPSAMI</h2>
<p>İşbu Sözleşmenin konusu; Personel'in, Yönetici tarafından sevk ve idare edilen şantiye ve çatı yapım sahalarında üstlendiği görevleri;</p>
<ul>
  <li>işin teknik gerekliliklerine,</li>
  <li>fen ve sanat kurallarına,</li>
  <li>6331 sayılı İş Sağlığı ve Güvenliği Kanunu ile ilgili yönetmelik, tebliğ ve genelge hükümlerine,</li>
  <li>iş ahlakına ve saha içi yazılı-sözlü talimatlara</li>
</ul>
<p>uygun olarak ifa etmesinin usul ve esaslarını belirlemektir.</p>

<h2>3. İŞ SAĞLIĞI VE GÜVENLİĞİ (İSG) VE MUTLAK YÜKÜMLÜLÜKLER</h2>
<p>Personel, çalışacağı sahanın — özellikle çatı ve yüksekte çalışma alanlarının — "<strong>Çok Tehlikeli</strong>" iş sınıfına girebileceğini bildiğini beyan eder.</p>
<p>Personel; ana şirket veya Yönetici tarafından kendisine tahsis edilen baret, emniyet kemeri, yaşam hattı bağlantı aparatları, çelik burunlu ayakkabı, eldiven ve sair tüm Kişisel Koruyucu Donanımları (KKD) sahada çalışıldığı sürece <strong>kesintisiz ve eksiksiz</strong> kullanacağını mutlak surette kabul, beyan ve taahhüt eder.</p>
<p>KKD kullanımına ilişkin Yönetici tarafından yapılacak her türlü uyarı ve talimata derhal uyulacaktır. Donanım kullanmayı reddeden, ihmal eden veya kurallara aykırı davranan Personel'in sahadaki çalışması Yönetici tarafından derhal durdurulabilir; bu süreçte doğacak hukuki, idari, cezai ve mali sorumluluklar Personel'e aittir ve bu durum <strong>haklı nedenle derhal fesih</strong> sebebidir.</p>
<p>Personel; İSG eğitimlerine, saha oryantasyonuna, işbaşı kontrollerine ve acil durum tatbikatlarına katılmayı kabul eder.</p>

<h2>4. SAHA ÇALIŞMA DÜZENİ, EMİR-TALİMAT YETKİSİ VE DİSİPLİN KURALLARI</h2>
<p>Görev yeri, günlük çalışma saatleri, işin uygulama metotları ve iş bölümü münhasıran Yönetici tarafından belirlenir. Personel, Yönetici'nin veya onun tayin ettiği usta başının talimatlarına tam bir sadakatle uymak zorundadır.</p>
<p>Personel;</p>
<ul>
  <li>saha içerisinde, çalışma saatlerinde veya dinlenme alanlarında alkol, uyuşturucu veya uyarıcı madde kullanamaz;</li>
  <li>sahaya bu maddelerin etkisi altında giriş yapamaz;</li>
  <li>diğer çalışanlara, iş sahibine, ana şirket yetkililerine veya üçüncü kişilere karşı ahlaka ve iyi niyete aykırı davranamaz;</li>
  <li>kavga, tehdit, hakaret veya iş disiplinini bozacak davranışlarda bulunamaz.</li>
</ul>
<p>Yukarıdaki hallerde Sözleşme Yönetici tarafından tek taraflı olarak, tazminatsız ve haklı nedenle feshedilebilir.</p>

<h2>5. SADAKAT, GİZLİLİK VE ZARARIN TAZMİNİ</h2>
<p>Personel, yürütülen projeye ait ticari sırları, şantiye detaylarını, teknik çizimleri, fiyat/metraj bilgilerini ve iş süreçlerini korumakla yükümlüdür.</p>
<p>Yönetici'nin yazılı onayı olmaksızın şantiyeden veya çalışma alanından sosyal medya platformlarında (TikTok, Instagram, YouTube vb.) veya başka mecralarda video, fotoğraf veya canlı yayın paylaşımı yapılamaz.</p>
<p>Personel'in kasıtlı, ihmalkar veya kusurlu davranışı neticesinde şantiyedeki malzemelere, çatı ekipmanlarına, iş makinelerine veya üçüncü kişilerin mülklerine verilecek maddi zararlar, doğmuş veya doğacak yevmiye/hakediş alacaklarından — ayrıca yasal yollara başvurma hakkı saklı kalmak kaydıyla — mahsup edilebilir.</p>

<h2>6. SÖZLEŞMENİN SÜRESİ, FESİH VE HESAPLAŞMA</h2>
<p>Sözleşme, Personel'in elektronik onayı ile yürürlüğe girer; görevin fiilen sona ermesi veya taraflarca feshedilmesi ile sona erer. Haklı nedenle fesih halleri saklıdır. Son dönem yevmiye, avans ve kesintiler dijital kayıtlar esas alınarak hesaplanır.</p>

<h2>7. ELEKTRONİK ONAY, DELİL VE YÜRÜRLÜK</h2>
<p>Personel, işbu Sözleşme metnini dijital başvuru platformu üzerinden okuduğunu; onay anına ilişkin tarih-saat, sürüm numarası, e-posta ve teknik kayıtların delil niteliğinde olduğunu; hiçbir baskı altında kalmadan özgür iradesiyle metnin tamamını kabul ettiğini beyan eder.</p>
<p>Sözleşme metninde değişiklik yapılması halinde güncel sürümün yeniden onaylanması gerekebilir.</p>

<h2>8. MESAİ, FAZLA ÇALIŞMA VE İZİN</h2>
<p>Günlük çalışma süresi ve mesai uygulamaları proje bazında Yönetici tarafından belirlenir. Fazla çalışma (mesai) kayıtları dijital puantaj sisteminde çeyrek, yarım veya tam mesai olarak işlenir; ücretlendirme yevmiye sözleşmesi ve proje kurallarına göre yapılır. Yıllık izin ve mazeret izinleri 4857 sayılı İş Kanunu ve ilgili mevzuat çerçevesinde uygulanır.</p>

<h2>9. UYUŞMAZLIK VE YETKİLİ MAHKEME</h2>
<p>İşbu Sözleşmeden doğan uyuşmazlıklarda öncelikle iyi niyetli müzakere ve arabuluculuk yolu denenir. Çözülemeyen uyuşmazlıklarda <strong>{{COMPANY_CITY}} İş Mahkemeleri ve İcra Daireleri</strong> yetkilidir.</p>

<h2>10. BÖLÜNEBİLİRLİK</h2>
<p>Herhangi bir hükmün geçersiz sayılması, diğer hükümlerin geçerliliğini etkilemez.</p>
$html$,
  3,
  true,
  1
),
(
  'kvkk-aydinlatma',
  'KVKK Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni',
  'Kimlik, iletişim, finans ve özlük verilerinizin hangi amaçlarla, hangi hukuki sebeplerle işlendiğini; aktarım, saklama süresi ve KVKK m.11 haklarınızı okuduğunuzu onaylarsınız.',
  $html$
<div class="contract-parties">
  <p><strong>Veri Sorumlusu:</strong> {{COMPANY_LEGAL_NAME}}</p>
  <p><strong>Adres:</strong> {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}</p>
  <p><strong>İrtibat:</strong> {{COMPANY_EMAIL}} · {{COMPANY_PHONE}}</p>
  <p><strong>Veri Sorumlusu Temsilcisi:</strong> {{COMPANY_DATA_CONTROLLER}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> KVKK m.10 aydınlatma metni (rıza gerektirmeyen bilgilendirme)</p>
  <p><strong>Yasal dayanak:</strong> 6698 sayılı KVKK ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ</p>
</div>

<h2>1. VERİ SORUMLUSUNUN KİMLİĞİ</h2>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("<strong>KVKK</strong>") uyarınca veri sorumlusu {{COMPANY_LEGAL_NAME}}'dir. Başvuru ve şikâyetlerinizi {{COMPANY_EMAIL}} adresine veya yazılı olarak {{COMPANY_ADDRESS}} adresine iletebilirsiniz.</p>

<h2>2. İŞLENEN KİŞİSEL VERİ KATEGORİLERİ</h2>
<ul>
  <li>Kimlik: ad-soyad, T.C. kimlik numarası, doğum tarihi;</li>
  <li>İletişim: telefon, e-posta, adres;</li>
  <li>Finans: IBAN, ödeme kayıtları;</li>
  <li>Özlük ve performans: pozisyon, işe giriş, yevmiye, puantaj, avans/kesinti;</li>
  <li>Görsel: başvuru fotoğrafı (kimlik teyidi);</li>
  <li>İşlem güvenliği: IP, oturum ve onay logları.</li>
</ul>

<h2>3. İŞLEME AMAÇLARI VE HUKUKİ SEBEPLER</h2>
<p>Verileriniz; iş ilişkisinin kurulması ve ifası (KVKK m.5/2-c), hukuki yükümlülüklerin yerine getirilmesi (m.5/2-ç), İSG ve iş mevzuatı, ücret ödemesi, saha güvenliği, uyuşmazlık ispatı ve meşru menfaat (m.5/2-f) kapsamında işlenir.</p>

<h2>4. VERİLERİN AKTARILDIĞI TARAFLAR</h2>
<p>Yasal zorunluluk halinde kamu kurumlarına; proje yürütümü için ana yüklenici/işveren yetkililerine; barındırma, e-posta ve altyapı hizmeti sunan tedarikçilere (KVKK m.8/9 önlemleriyle) aktarılabilir.</p>

<h2>5. TOPLAMA YÖNTEMİ VE SAKLAMA SÜRESİ</h2>
<p>Veriler elektronik başvuru formu, personel paneli, puantaj kayıtları ve yönetici girişleri aracılığıyla toplanır. Saklama süresi ilgili mevzuat ve işleme amacının gerektirdiği süre ile sınırlıdır.</p>

<h2>6. İLGİLİ KİŞİNİN HAKLARI (KVKK m.11)</h2>
<p>Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurular en geç 30 gün içinde yanıtlanır.</p>

<h2>7. AYDINLATMA ONAYI</h2>
<p>Personel; işbu aydınlatma metnini okuduğunu, veri sorumlusunun kimliğini ve kişisel verilerinin işlenmesine ilişkin esasları anladığını elektronik ortamda onaylar. Açık rıza gerektiren işlemler için ayrıca "Açık Rıza ve Gizlilik" belgesi imzalanır.</p>
$html$,
  3,
  true,
  2
),
(
  'gizlilik-veri',
  'Kişisel Veriler Açık Rıza, Gizlilik ve Bilgi Güvenliği Taahhütnamesi',
  'Kişisel verilerinizin işlenmesi, saklanması ve aktarımına açık rıza verir; saha ve kurumsal gizlilik yükümlülüklerinizi kabul edersiniz.',
  $html$
<div class="contract-parties">
  <p><strong>Veri Sorumlusu:</strong> {{COMPANY_LEGAL_NAME}}</p>
  <p><strong>Adres:</strong> {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}</p>
  <p><strong>İrtibat:</strong> {{COMPANY_EMAIL}} · {{COMPANY_PHONE}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> KVKK açık rıza ve gizlilik taahhütnamesi</p>
  <p><strong>Önkoşul:</strong> "KVKK Aydınlatma Metni" ayrıca okunmuş ve onaylanmış olmalıdır.</p>
</div>

<h2>1. TAAHHÜTNAMENİN AMACI VE YASAL DAYANAĞI</h2>
<p>İşbu Taahhütname; 6698 sayılı Kişisel Verilerin Korunması Kanunu ("<strong>KVKK</strong>") ve ilgili ikincil mevzuat uyarınca, Personel'in saha çalışması süresince ve sonrasında edindiği kurumsal, ticari, kişisel ve teknik verilerin güvenliğinin sağlanması, gizliliğinin korunması ve hukuka aykırı işlenmesinin önlenmesi amacıyla düzenlenmiştir.</p>

<h2>2. İŞLENEN KİŞİSEL VERİ KATEGORİLERİ</h2>
<p>Personel'e ait başlıca veri kategorileri şunlardır:</p>
<ul>
  <li>Kimlik ve iletişim: ad-soyad, T.C. kimlik numarası, doğum tarihi, telefon, e-posta;</li>
  <li>Finans: banka IBAN bilgisi;</li>
  <li>Özlük ve saha: pozisyon, işe giriş, yevmiye, puantaj, avans/kesinti kayıtları;</li>
  <li>Görsel kayıt: başvuru sırasında alınan fotoğraf (kimlik teyidi amacıyla);</li>
  <li>İSG kapsamında gerekli olabilecek sağlık/uygunluk bilgileri (kanunen zorunlu hallerde).</li>
</ul>

<h2>3. İŞLEME AMAÇLARI VE HUKUKİ SEBEPLER</h2>
<p>Kişisel veriler; iş sözleşmesinin kurulması ve ifası, ücret/yevmiye ödemelerinin yapılması, İSG ve iş mevzuatından doğan yükümlülüklerin yerine getirilmesi, saha giriş-çıkış güvenliği, personel yönetimi, uyuşmazlıkların ispatı ve meşru menfaat kapsamında sınırlı ve ölçülü olarak işlenir.</p>
<p>TC kimlik, doğum tarihi ve IBAN gibi hassas veriler uygulama katmanında şifreli saklanır; yalnızca yetkili yöneticiler tarafından erişilebilir.</p>

<h2>4. VERİ AKTARIMI VE ÜÇÜNCÜ KİŞİLERE İFŞA YASAĞI</h2>
<p>Veriler yalnızca;</p>
<ul>
  <li>yasal zorunluluk halinde resmi makamlara (SGK, kolluk, mahkeme vb.),</li>
  <li>projenin yürütülmesi için zorunlu olan ana yüklenici / işveren yetkililerine,</li>
  <li>barındırma, e-posta ve altyapı hizmeti sunan teknik tedarikçilere (KVKK m.8/9 uyarınca gerekli önlemlerle)</li>
</ul>
<p>aktarılabilir. Bunun dışında üçüncü kişilere aktarım yapılamaz.</p>
<p>Personel de sahadaki diğer çalışanlara veya iş süreçlerine dair öğrendiği verileri izinsiz paylaşamaz.</p>

<h2>5. SAKLAMA SÜRESİ VE VERİ GÜVENLİĞİ</h2>
<p>Veriler, ilgili mevzuatta öngörülen süreler ve işleme amacının gerektirdiği süre boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir. Teknik ve idari tedbirler (şifreleme, erişim kısıtı, loglama) uygulanır.</p>

<h2>6. KVKK KAPSAMINDAKİ HAKLAR</h2>
<p>Personel; KVKK m.11 kapsamındaki haklarını (bilgi talebi, düzeltme, silme, itiraz vb.) Yönetici'ye yazılı veya kayıtlı elektronik iletişim kanalları üzerinden iletebilir. Başvurular mevzuattaki sürelerde yanıtlanır.</p>

<h2>7. GİZLİLİK YÜKÜMLÜLÜĞÜNÜN SÜRESİ</h2>
<p>Gizlilik ve sır saklama yükümlülükleri, sahadaki çalışmanın sona ermesinden sonra da süresiz devam eder. İhlal halinde tazminat ve sair hukuki yollara başvurma hakkı saklıdır.</p>

<h2>8. AÇIK RIZA VE ELEKTRONİK ONAY</h2>
<p>Personel; KVKK Aydınlatma Metni'ni okuduğunu teyit ederek; kişisel verilerinin ve gerektiğinde özel nitelikli kişisel verilerinin işbu metinde belirtilen amaçlarla işlenmesine, saklanmasına ve aktarılmasına özgür iradesiyle elektronik ortamda <strong>açık rıza</strong> verdiğini kabul eder.</p>
$html$,
  3,
  true,
  3
),
(
  'ucret-yevmiye',
  'Ücret, Yevmiye, Hakediş ve Ödeme Usulleri Bilgilendirme ve Onay Metni',
  'Yevmiye hesaplama, mesai, avans/mahsup, IBAN ödemesi, delil sözleşmesi ve vergi/SGK kesintilerine ilişkin kuralları okuyup onaylarsınız.',
  $html$
<div class="contract-parties">
  <p><strong>İşletmeci:</strong> {{COMPANY_LEGAL_NAME}} ({{COMPANY_TRADE_NAME}})</p>
  <p><strong>Adres:</strong> {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}</p>
  <p><strong>İletişim:</strong> {{COMPANY_EMAIL}} · {{COMPANY_PHONE}}</p>
</div>
<div class="contract-meta">
  <p><strong>Belge türü:</strong> Ücret ve ödeme usulleri bilgilendirme metni</p>
  <p><strong>Önemli:</strong> Nihai günlük yevmiye tutarı, Yönetici onayı sırasında sisteme işlenir ve Personel'e gösterilir.</p>
</div>

<h2>1. YEVMİYE ESASI VE SİSTEM KAYITLARININ KESİNLİĞİ</h2>
<p>Personel'in sahada fiilen çalıştığı her tam gün için alacağı günlük ücret ("<strong>Yevmiye</strong>"), Yönetici tarafından belirlenir ve dijital sistem üzerinden onay aşamasında Personel'e sunulur. Personel, yönetici onayı ile sisteme işlenen yevmiye tutarını kabul etmiş sayılır.</p>
<p>Çalışılan günlerin, fazla mesailerin, eksik günlerin ve saha devamsızlıklarının tespitinde; şantiye puantaj kayıtları, dijital sistem logları, onaylı yevmiye/avans/kesinti kayıtları ve Yönetici'nin onayladığı saha takip verileri <strong>kesin delil</strong> niteliğindedir.</p>

<h2>2. AVANS, BORÇLANMA VE HAKEDİŞTEN MAHSUP</h2>
<p>Personel'in çalışma süresi içinde talep ettiği nakit veya havale avanslar dijital sistemde kayıt altına alınır. Onaylanan avanslar ile Personel'in kusurundan doğan malzeme/ekipman zararları ve mevzuata uygun kesintiler, ilgili dönem hakediş/yevmiye toplamından mahsup edilir; kalan bakiye net ödemeyi oluşturur.</p>

<h2>3. BANKA HESABI (IBAN) VE ÖDEME USULÜ</h2>
<p>Ödemeler, münhasıran Personel'in kendi adına açılmış ve sisteme beyan ettiği IBAN hesabına yapılır. Üçüncü şahıs hesaplarına ödeme yapılmaz.</p>
<p>IBAN değişikliği sistem veya yazılı yöntemle Yönetici'ye bildirilmedikçe, önceki hesaba yapılan ödemeler geçerli sayılır. Personel, beyan ettiği bilgilerin doğruluğundan sorumludur.</p>

<h2>4. ÖDEME ZAMANLARI VE BEYAN YÜKÜMLÜLÜĞÜ</h2>
<p>Ödeme periyotları (haftalık, on beş günlük, aylık vb.) Yönetici tarafından proje bazında belirlenir ve Personel'e bildirilir. Personel panelinden yevmiye, avans ve kesinti kayıtlarını takip edebilir.</p>

<h2>5. UYUŞMAZLIK VE DELİL SÖZLEŞMESİ</h2>
<p>Ücret, yevmiye, fazla çalışma veya alacak uyuşmazlıklarında; 6100 sayılı Hukuk Muhakemeleri Kanunu'nun 193. maddesi uyarınca, dijital personel yönetim sistemi veritabanı kayıtları, onay logları, puantaj tabloları, sözleşme onay kayıtları ve Yönetici onaylı bordro/yevmiye verileri <strong>kesin, bağlayıcı ve öncelikli delil</strong> teşkil eder.</p>

<h2>6. VERGİ, SGK VE YASAL KESİNTİLER</h2>
<p>Personel'e yapılacak ödemelerde, ana işveren/yüklenici nezdinde yürürlükte olan vergi, sigorta ve yasal kesinti usulleri uygulanır. Personel, bu konudaki yasal yükümlülüklerin ilgili mevzuat ve işveren kayıtları çerçevesinde yerine getirileceğini kabul eder.</p>

<h2>7. BEYAN VE ELEKTRONİK KABUL</h2>
<p>Personel; yevmiye hesaplama yöntemini, avans/mahsup kurallarını, ödeme usullerini ve delil sözleşmesini eksiksiz okuduğunu; sistemde tanımlanan güncel yevmiye ve ödeme şartlarını kabul ettiğini elektronik ortamda onaylayarak taahhüt eder.</p>
<p><em>Not: Kesin yevmiye tutarı, yönetici onay ekranında ayrıca gösterilir ve o an onaylanır.</em></p>

<h2>8. MESAİ ÜCRETLENDİRMESİ</h2>
<p>Fazla çalışma (mesai) kayıtları sistemde çeyrek (%25), yarım (%50) veya tam (%100) günlük yevmiye ek ücreti olarak işlenir. Mesai onayı yönetici ve personel çift onayına tabidir.</p>

<h2>9. UYUŞMAZLIK VE YETKİLİ MAHKEME</h2>
<p>Ücret uyuşmazlıklarında dijital kayıtlar delil sözleşmesi kapsamında esas alınır. Yetkili mahkeme <strong>{{COMPANY_CITY}} İş Mahkemeleri</strong>dir.</p>
$html$,
  3,
  true,
  4
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  content_html = excluded.content_html,
  version = excluded.version,
  sort_order = excluded.sort_order,
  is_required = excluded.is_required,
  updated_at = now();
