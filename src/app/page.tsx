import Link from 'next/link';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import { APP_TAGLINE_TR } from '@/lib/brand';
import { cardClass } from '@/components/ui/styles';

const STEPS = [
  {
    title: 'Etkinliği gör',
    text: 'Yayınlanan etkinliğin tarihini, yerini ve kontenjanını aç.',
  },
  {
    title: 'Kayıt ol',
    text: 'Formu doldur. Sana bir kayıt numarası verilir.',
  },
  {
    title: 'Katılımını göster',
    text: 'Gününde QR bilgini görevliye okut.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900">
      <HomeHeader />

      <main>
        <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f7fbff] to-white" />
            <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute right-[-4rem] top-16 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              Öğrenci hizmeti · üniversiteden bağımsız
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-[#2D6AF6] sm:text-5xl">
              Etkinlikleri gör,
            </h1>
            <h2 className="mt-1 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              kaydını tamamla.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {APP_TAGLINE_TR}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0E1548] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060]"
              >
                Giriş yap
              </Link>
            </div>
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <h2 className="text-center text-lg font-bold text-[#0E1548]">Nasıl çalışır</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className={`${cardClass} p-5`}>
                <p className="text-xs font-semibold tracking-wide text-[#2D6AF6]">0{index + 1}</p>
                <h3 className="mt-2 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="etkinlik" className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
          <article className={`${cardClass} overflow-hidden`}>
            <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Örnek etkinlik</p>
                <h2 className="mt-2 text-2xl font-bold text-[#0E1548]">Abana 2027</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
                  Üniversite içinde düzenlenen bir etkinlik örneği. Katılımcı sayısı, maliyet ve
                  etkinlik ayrıntıları burada kamuoyuna açık tutulur.
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Tarih</dt>
                    <dd className="font-medium text-slate-900">12–14 Mayıs 2027</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Yer</dt>
                    <dd className="font-medium text-slate-900">Abana, Kastamonu</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Kontenjan</dt>
                    <dd className="font-medium text-slate-900">120</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Durum</dt>
                    <dd className="font-medium text-[#0E1548]">Kayıt açık</dd>
                  </div>
                </dl>
              </div>
              <div className="flex items-end bg-gradient-to-br from-[#0E1548] to-[#2D6AF6] p-6 text-white sm:p-8">
                <p className="text-sm leading-relaxed text-white/90">
                  Amaç büyütmek değil: etkinlik anında kişileri ve maliyeti hesaplamak, sonucu açıkça paylaşmak.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
