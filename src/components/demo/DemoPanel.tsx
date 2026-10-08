import { cookies } from 'next/headers';
import { StatCard } from '@/components/ui/StatCard';
import { TableCell, TableHeader } from '@/components/ui/Table';
import { cardClass } from '@/components/ui/styles';
import { DEMO_AUDIT, DEMO_CHECKIN_TOKEN, DEMO_EVENTS, DEMO_PARTICIPANTS } from '@/lib/demo/data';
import { DEMO_COOKIE, parseDemoRole } from '@/lib/demo/session';
import type { AppRole } from '@/lib/auth/roles';

export type DemoView =
  | 'admin-home'
  | 'admin-events'
  | 'admin-participants'
  | 'admin-checkin'
  | 'admin-reports'
  | 'admin-audit'
  | 'admin-settings'
  | 'staff-events'
  | 'staff-checkin'
  | 'student-events'
  | 'student-registrations'
  | 'student-qr';

const TITLES: Record<DemoView, { title: string; description: string }> = {
  'admin-home': { title: 'Dashboard', description: 'Örnek etkinlik özeti.' },
  'admin-events': { title: 'Events', description: 'Örnek etkinlik listesi.' },
  'admin-participants': { title: 'Participants', description: 'Örnek katılımcı listesi.' },
  'admin-checkin': { title: 'Check-in', description: 'Örnek katılım kayıtları.' },
  'admin-reports': { title: 'Reports', description: 'Örnek filtre: Abana 2027 · Gün 1 · Katıldı.' },
  'admin-audit': { title: 'Audit Logs', description: 'Örnek denetim kayıtları.' },
  'admin-settings': { title: 'Settings', description: 'Demo hesapları gerçek kullanıcı oluşturmaz.' },
  'staff-events': { title: 'Events', description: 'Yalnızca sana atanmış örnek etkinlik.' },
  'staff-checkin': { title: 'Check-in', description: 'Abana 2027 örnek katılım listesi.' },
  'student-events': { title: 'Events', description: 'Kayıta açık örnek etkinlikler.' },
  'student-registrations': { title: 'My registrations', description: 'Ayşe Yılmaz demo kaydı.' },
  'student-qr': { title: 'My QR', description: 'Demo QR kişisel veri taşımaz.' },
};

function Banner() {
  return (
    <p className="rounded-2xl bg-[#0E1548]/5 px-3 py-2 text-xs font-medium text-[#0E1548]">
      Demo oturumu — ekrandaki kayıtlar örnek veridir.
    </p>
  );
}

function EventTable({ staffOnly }: { staffOnly?: boolean }) {
  const rows = staffOnly ? DEMO_EVENTS.filter((event) => event.assignedToStaff) : DEMO_EVENTS;
  return (
    <div className={`${cardClass} overflow-x-auto`}>
      <table className="min-w-full">
        <thead>
          <tr>
            <TableHeader>Etkinlik</TableHeader>
            <TableHeader>Tarih</TableHeader>
            <TableHeader>Yer</TableHeader>
            <TableHeader>Kontenjan</TableHeader>
            <TableHeader>Durum</TableHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr key={event.id} className="border-t border-slate-100">
              <TableCell className="font-medium text-slate-900">{event.title}</TableCell>
              <TableCell>{event.startsAt}</TableCell>
              <TableCell>{event.location}</TableCell>
              <TableCell>{event.capacity}</TableCell>
              <TableCell>{event.status}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantTable({ onlyStudent, attendanceOnly }: { onlyStudent?: boolean; attendanceOnly?: boolean }) {
  const rows = DEMO_PARTICIPANTS.filter((row) => (onlyStudent ? row.isDemoStudent : true));
  return (
    <div className={`${cardClass} overflow-x-auto`}>
      <table className="min-w-full">
        <thead>
          <tr>
            <TableHeader>Kayıt no</TableHeader>
            <TableHeader>Ad</TableHeader>
            <TableHeader>Öğrenci no</TableHeader>
            <TableHeader>Bölüm</TableHeader>
            <TableHeader>Sınıf</TableHeader>
            <TableHeader>Etkinlik</TableHeader>
            <TableHeader>Kayıt</TableHeader>
            <TableHeader>Katılım</TableHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.registrationNo} className="border-t border-slate-100">
              <TableCell className="font-medium text-[#0E1548]">{row.registrationNo}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.studentNo}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.classYear}</TableCell>
              <TableCell>{row.event}</TableCell>
              <TableCell>{row.registeredAt}</TableCell>
              <TableCell>
                {attendanceOnly || !onlyStudent ? `${row.attendance} · ${row.day}` : row.attendance}
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function bodyFor(view: DemoView, role: AppRole) {
  if (view === 'admin-home') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Events" value={DEMO_EVENTS.length} />
        <StatCard title="Participants" value={DEMO_PARTICIPANTS.length} />
        <StatCard title="Check-ins" value={DEMO_PARTICIPANTS.filter((row) => row.attendance === 'Katıldı').length} />
      </div>
    );
  }
  if (view === 'admin-events' || view === 'student-events') return <EventTable />;
  if (view === 'staff-events') return <EventTable staffOnly />;
  if (view === 'admin-participants' || view === 'admin-reports') return <ParticipantTable />;
  if (view === 'admin-checkin' || view === 'staff-checkin') return <ParticipantTable attendanceOnly />;
  if (view === 'student-registrations') return <ParticipantTable onlyStudent />;
  if (view === 'admin-audit') {
    return (
      <div className={`${cardClass} overflow-x-auto`}>
        <table className="min-w-full">
          <thead>
            <tr>
              <TableHeader>Zaman</TableHeader>
              <TableHeader>Kişi</TableHeader>
              <TableHeader>İşlem</TableHeader>
              <TableHeader>Hedef</TableHeader>
            </tr>
          </thead>
          <tbody>
            {DEMO_AUDIT.map((row) => (
              <tr key={`${row.when}-${row.action}`} className="border-t border-slate-100">
                <TableCell>{row.when}</TableCell>
                <TableCell>{row.actor}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>{row.target}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (view === 'student-qr') {
    const mine = DEMO_PARTICIPANTS.find((row) => row.isDemoStudent);
    return (
      <div className={`${cardClass} mx-auto max-w-sm p-6 text-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr?token=${encodeURIComponent(DEMO_CHECKIN_TOKEN)}`}
          alt="Check-in QR kodu"
          width={220}
          height={220}
          className="mx-auto h-44 w-44 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100"
        />
        <p className="mt-4 text-sm font-semibold text-[#0E1548]">{mine?.registrationNo}</p>
        <p className="mt-1 text-xs text-slate-500">{mine?.name} · {mine?.event}</p>
        <p className="mt-3 text-xs text-slate-500">QR içeriği yalnızca demo tokendır; ad ve öğrenci numarası kodun içinde yoktur.</p>
      </div>
    );
  }
  return (
    <div className={`${cardClass} p-6 text-sm text-slate-600`}>
      Demo rolü: {role}. Örnek ayar kaydı yok.
    </div>
  );
}

function SampleBanner() {
  return (
    <p className="rounded-2xl bg-[#0E1548]/5 px-3 py-2 text-xs font-medium text-[#0E1548]">
      Örnek veri — canlı etkinlik kaydı henüz bağlanmadı; ekrandaki kayıtlar demedir.
    </p>
  );
}

export async function DemoPanel({ view }: { view: DemoView }) {
  const jar = await cookies();
  const role = parseDemoRole(jar.get(DEMO_COOKIE)?.value);
  const copy = TITLES[view];
  const inferredRole: AppRole = role
    ?? (view.startsWith('admin-') ? 'admin' : view.startsWith('staff-') ? 'staff' : 'student');

  // Phase 1: show DEMO_* tables for every authenticated panel visit.
  // Real Supabase login has no demo cookie; without this fallback the student
  // Events page only rendered an empty PlaceholderCard.
  return (
    <div className="space-y-4">
      {role ? <Banner /> : <SampleBanner />}
      <div>
        <h1 className="text-lg font-bold text-[#0E1548]">{copy.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{copy.description}</p>
      </div>
      {bodyFor(view, inferredRole)}
    </div>
  );
}
