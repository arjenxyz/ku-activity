-- Örnek sözleşmeler — metinleri kendi hukuki danışmanınızla güncelleyin.
-- Supabase SQL Editor'da 016 migration'dan sonra çalıştırın.

insert into public.personnel_contracts (slug, title, content_html, version, is_required, sort_order)
values
(
  'ekip-calismasi',
  'Ekip Çalışması ve Görev Kabul Sözleşmesi',
  $html$
<h2>1. Taraflar</h2>
<p>İşbu sözleşme; bir tarafta proje/ekip yöneticisi (&quot;Yönetici&quot;) ile diğer tarafta başvuru yapan personel (&quot;Personel&quot;) arasında, şirket tüzel kişiliği bulunmaksızın ekip bazlı çalışma düzenine ilişkin olarak akdedilmiştir.</p>
<h2>2. Konu</h2>
<p>Personel, Yönetici tarafından yönlendirilen inşaat/şantiye veya proje kapsamındaki işleri, iş güvenliği kurallarına uyarak yerine getirmeyi kabul eder.</p>
<h2>3. Çalışma Düzeni</h2>
<p>Görev yeri, çalışma saatleri ve günlük iş kapsamı Yönetici tarafından belirlenir. Personel verilen talimatlara uygun hareket eder.</p>
<h2>4. Ücretlendirme</h2>
<p>Günlük yevmiye ve ödeme koşulları Yönetici onayı sırasında sisteme işlenir; Personel bu bilgileri onaylar.</p>
<h2>5. Fesih</h2>
<p>Taraflar karşılıklı anlaşma veya haklı nedenle iş ilişkisini sonlandırabilir. Son ücret ve hesaplaşma yapılır.</p>
<h2>6. Kabul</h2>
<p>Personel, bu metni baştan sona okuduğunu, anladığını ve elektronik ortamda onay verdiğini beyan eder.</p>
<p><em>Not: Bu metin şablondur; nihai metin için hukuk danışmanına başvurun.</em></p>
$html$,
  1,
  true,
  1
),
(
  'gizlilik-veri',
  'Gizlilik ve Kişisel Veri Taahhütnamesi',
  $html$
<h2>1. Amaç</h2>
<p>Personel; şantiye, proje ve ekip içinde öğrendiği ticari, teknik ve kişisel bilgilerin gizliliğini koruyacağını taahhüt eder.</p>
<h2>2. Kişisel Veriler</h2>
<p>T.C. kimlik, doğum tarihi, IBAN ve iletişim bilgileri yalnızca ücret ödemesi, yasal yükümlülükler ve personel yönetimi amacıyla işlenir; şifreli saklanır.</p>
<h2>3. Üçüncü Kişiler</h2>
<p>Proje dışındaki kişilere bilgi aktarılmaz; zorunlu hallerde Yönetici onayı aranır.</p>
<h2>4. Süre</h2>
<p>Gizlilik yükümlülüğü çalışma süresince ve sonrasında da devam eder.</p>
<h2>5. Kabul</h2>
<p>Personel KVKK kapsamında bilgilendirildiğini ve kişisel verilerinin işlenmesine onay verdiğini kabul eder.</p>
$html$,
  1,
  true,
  2
),
(
  'ucret-yevmiye',
  'Ücret, Yevmiye ve Ödeme Bilgilendirme Metni',
  $html$
<h2>1. Yevmiye</h2>
<p>Personelin günlük yevmiyesi yönetici onayı ile sisteme kaydedilir. Onaylı yevmiye kayıtları esas alınır.</p>
<h2>2. Avans ve Kesinti</h2>
<p>Avans talepleri ve kesintiler sistem üzerinden kayıt altına alınır; Personel panelinden görüntülenebilir.</p>
<h2>3. Ödeme</h2>
<p>Ödemeler bildirilen IBAN hesabına yapılır. IBAN değişikliği yazılı/bildirimli olarak iletilmelidir.</p>
<h2>4. Uyuşmazlık</h2>
<p>Ücret uyuşmazlıklarında sistem kayıtları ve yönetici onaylı bordro/yevmiye verileri dikkate alınır.</p>
<h2>5. Kabul</h2>
<p>Personel ödeme usulünü okuduğunu ve kabul ettiğini beyan eder.</p>
$html$,
  1,
  true,
  3
)
on conflict (slug) do update set
  title = excluded.title,
  content_html = excluded.content_html,
  version = excluded.version,
  sort_order = excluded.sort_order,
  updated_at = now();
