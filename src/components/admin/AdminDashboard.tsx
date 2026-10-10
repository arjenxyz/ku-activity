import Link from 'next/link';
import {
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiMapPin,
  FiSettings,
} from 'react-icons/fi';
import { getSiteSession } from '@/lib/auth/get-site-session';
import { listCatalogEvents } from '@/lib/events/catalog-store';
import { listRegistrationsForEvent } from '@/lib/demo/registrations-store';
import { DEMO_AUDIT } from '@/lib/demo/data';

const QUICK_LINKS = [
  {
    href: '/admin/events',
    label: 'Etkinlikler',
    hint: 'Seç, yönet, araçları aç',
    icon: FiCalendar,
    tone: 'bg-[#e8f0ff] text-[#2D6AF6]',
  },
  {
    href: '/admin/events/new',
    label: 'Yeni etkinlik',
    hint: 'Oluştur ve yayınla',
    icon: FiClipboard,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/admin/egitim',
    label: 'Panel Eğitimi',
    hint: 'Canlı menü rehberi',
    icon: FiBookOpen,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    href: '/admin/settings',
    label: 'Ayarlar',
    hint: 'Panel tercihleri',
    icon: FiSettings,
    tone: 'bg-amber-50 text-amber-800',
  },
];

export async function AdminDashboard() {
  const session = await getSiteSession();
  const name = session?.name?.trim() || null;
  const title = name ? `Merhaba, ${name}` : 'Admin ana sayfası';

  const events = listCatalogEvents();
  const openEvents = events.filter(
    (event) => event.status === 'registration_open' || event.status === 'published'
  );
  const registrationTotal = events.reduce(
    (sum, event) => sum + listRegistrationsForEvent(event.id).length,
    0
  );
  const checkInTotal = events.reduce(
    (sum, event) =>
      sum +
      listRegistrationsForEvent(event.id).reduce((inner, reg) => inner + reg.attendance.length, 0),
    0
  );
  const staffAssigned = events.filter((event) => event.assignedToStaff).length;

  const stats = [
    { label: 'Etkinlik', value: events.length, detail: `${openEvents.length} yayında / kayıt açık` },
    { label: 'Kayıt', value: registrationTotal, detail: 'Aktif etkinlik kayıtları' },
    { label: 'Check-in', value: checkInTotal, detail: 'Tarama ile alınan yoklama' },
    { label: 'Görevli atanmış', value: staffAssigned, detail: 'Check-in için açık' },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="relative bg-gradient-to-br from-[#0E1548] via-[#152060] to-[#2D6AF6] px-5 py-6 text-white sm:px-6">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              Etkinlikleri yönet, kayıtları izle, check-in ve ekip işlemlerini buradan yürüt.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/admin/events/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Yeni etkinlik
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/egitim"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                <FiBookOpen className="h-4 w-4" />
                Panel Eğitimi
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-[#0E1548]">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#0E1548]">Hızlı işlemler</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6AF6]/30 hover:shadow-md"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-[#0E1548]">{item.label}</span>
                  <span className="mt-1 text-xs text-slate-500">{item.hint}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#2D6AF6]">
                    Aç
                    <FiArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#0E1548]">Etkinlikler</h2>
            <Link href="/admin/events" className="text-xs font-medium text-[#2D6AF6] hover:underline">
              Tümü
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {events.slice(0, 4).map((event) => {
              const taken = listRegistrationsForEvent(event.id).length;
              const fill = Math.min(100, Math.round((taken / Math.max(1, event.capacity)) * 100));
              return (
                <li key={event.id}>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3 transition hover:border-[#2D6AF6]/25 hover:bg-[#e8f0ff]/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#0E1548]">{event.title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <FiMapPin className="h-3.5 w-3.5 text-[#2D6AF6]" />
                          {event.location}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e8f0ff] px-2 py-0.5 text-[11px] font-medium text-[#2D6AF6]">
                        {event.statusLabel}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                        <span>
                          {taken}/{event.capacity} kayıt
                        </span>
                        <span>
                          {event.startsAt === event.endsAt
                            ? event.startsAt
                            : `${event.startsAt} – ${event.endsAt}`}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[#2D6AF6]" style={{ width: `${fill}%` }} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#0E1548]">Son işlemler</h2>
            <Link href="/admin/audit-logs" className="text-xs font-medium text-[#2D6AF6] hover:underline">
              Audit
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {DEMO_AUDIT.map((row) => (
              <li
                key={`${row.when}-${row.action}`}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3"
              >
                <p className="text-sm font-medium text-[#0E1548]">{row.action}</p>
                <p className="mt-1 text-xs text-slate-500">{row.target}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {row.actor} · {row.when}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
