import Link from 'next/link';
import {
  FiArrowRight,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiFileText,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

type GuideStep = {
  step: string;
  title: string;
  body: string;
};

type GuideItem = {
  href: string;
  label: string;
  body: string;
  icon: IconType;
};

const HOW_IT_WORKS: GuideStep[] = [
  {
    step: '1',
    title: 'Sol menüden başla',
    body: 'Ana sayfa, etkinlikler, ekip ilanı, denetim ve ayarlar her zaman menüde durur.',
  },
  {
    step: '2',
    title: 'Önce bir etkinlik seç',
    body: 'Katılımcı, ödeme, check-in ve rapor araçları yalnızca etkinlik seçildikten sonra menüde görünür.',
  },
  {
    step: '3',
    title: 'İşlemi orada bitir',
    body: 'Etkinlik çalışma alanından ilgili araca geç; iş bitince Ana menü ile geri dönebilirsin.',
  },
];

const MENU_GUIDE: GuideItem[] = [
  {
    href: '/admin/events',
    label: 'Etkinlikler',
    body: 'Listele, filtrele, yeni etkinlik oluştur. Bir etkinliğe girince katılımcı, havale, elden ödeme, kasa ve check-in araçları menüye eklenir.',
    icon: FiCalendar,
  },
  {
    href: '/admin/team',
    label: 'Ekip ilanı',
    body: 'Görevli ilanı aç, başvuruları incele, onayla veya kapat. Etkinlik ekibine personel almak için burayı kullan.',
    icon: FiUsers,
  },
  {
    href: '/admin/audit-logs',
    label: 'Denetim kayıtları',
    body: 'Kim ne zaman ne yaptı — kritik panel işlemlerinin izini buradan takip et.',
    icon: FiFileText,
  },
  {
    href: '/admin/settings',
    label: 'Ayarlar',
    body: 'Panel tercihleri ve hesapla ilgili ayarlar. Dil seçimi üst çubuktaki bayraktan da değişir.',
    icon: FiSettings,
  },
];

const EVENT_TOOLS: GuideItem[] = [
  {
    href: '/admin/events',
    label: 'Katılımcılar',
    body: 'Kayıtlı öğrencileri görüntüle, detaya in, ödeme ve yoklama durumunu kontrol et.',
    icon: FiUsers,
  },
  {
    href: '/admin/events',
    label: 'Havale incelemeleri',
    body: 'Banka dekontu yükleyen kayıtları incele; onayla veya reddet.',
    icon: FiClipboard,
  },
  {
    href: '/admin/events',
    label: 'Elden teslim / Kasa',
    body: 'Nakit teslim al, QR ile ödeme işle; yetkili değişiminde kasa devrini kaydet.',
    icon: FiCheckSquare,
  },
  {
    href: '/admin/events',
    label: 'Check-in',
    body: 'Etkinlik günü QR veya kayıt no ile yoklama al.',
    icon: FiCheckSquare,
  },
];

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E1548] sm:text-3xl">
          Admin ana sayfası
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Bu sayfa paneli tanıtır. Menüleri ve sistemleri nasıl kullanacağını adım adım burada
          öğrenebilirsin.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0E1548]">Nasıl çalışır?</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-sm font-semibold text-white">
                {item.step}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0E1548]">{item.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0E1548]">Ana menü</h2>
        <p className="mt-1 text-xs text-slate-500">Her zaman görünür — buradan genel işlere geç.</p>
        <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
          {MENU_GUIDE.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 py-4 transition hover:bg-slate-50/80"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2D6AF6]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#0E1548]">
                      {item.label}
                      <FiArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2D6AF6]" />
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      {item.body}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0E1548]">Etkinlik araçları</h2>
        <p className="mt-1 text-xs text-slate-500">
          Bunlar yalnızca bir etkinlik seçildikten sonra menüde açılır. Başlamak için etkinlik
          listesine git.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {EVENT_TOOLS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0E1548]">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{item.body}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <Link
          href="/admin/events"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2D6AF6] hover:underline"
        >
          Etkinlik listesine git
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
