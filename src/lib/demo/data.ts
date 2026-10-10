import type { PaymentMethod, PaymentStatus } from '@/lib/payments/types';
export type { PaymentStatus } from '@/lib/payments/types';
export { PAYMENT_STATUS_LABELS } from '@/lib/payments/types';

export type DemoEvent = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
  assignedToStaff: boolean;
};

export type DemoParticipant = {
  registrationNo: string;
  name: string;
  studentNo: string;
  department: string;
  classYear: string;
  eventId: string;
  event: string;
  registeredAt: string;
  attendance: 'Katıldı' | 'Bekliyor';
  day: string;
  isDemoStudent: boolean;
  phone: string;
  email: string;
  paymentCode: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod | string;
  paymentNote: string;
  custodianStaffId: string | null;
  custodianName: string | null;
};

/** Opaque check-in payload for the demo student QR (no name / student no). */
export const DEMO_CHECKIN_TOKEN = 'ems_demo_ck_7f3a9c2e1b8d4f60';

export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: 'abana-2027',
    title: 'Abana 2027',
    location: 'Abana, Kastamonu',
    startsAt: '12 Mayıs 2027',
    endsAt: '14 Mayıs 2027',
    capacity: 120,
    status: 'Kayıt açık',
    assignedToStaff: true,
  },
  {
    id: 'tanisma-2026',
    title: 'Turizm Fakültesi Tanışma',
    location: 'Kastamonu Üniversitesi',
    startsAt: '18 Ekim 2026',
    endsAt: '18 Ekim 2026',
    capacity: 200,
    status: 'Yayında',
    assignedToStaff: false,
  },
];

export const DEMO_PARTICIPANTS: DemoParticipant[] = [
  {
    registrationNo: 'ABN-2027-000184',
    name: 'Ayşe Yılmaz',
    studentNo: '202100184',
    department: 'Turizm İşletmeciliği',
    classYear: '3',
    eventId: 'abana-2027',
    event: 'Abana 2027',
    registeredAt: '2 Ekim 2026',
    attendance: 'Katıldı',
    day: 'Gün 1',
    isDemoStudent: true,
    phone: '0532 000 01 84',
    email: 'ornek.ayse@ogrenci.kastamonu.edu.tr',
    paymentCode: 'ABN-7F2K',
    paymentStatus: 'pending',
    paymentAmount: 850,
    paidAmount: 0,
    paymentMethod: '',
    paymentNote: '',
    custodianStaffId: null,
    custodianName: null,
  },
  {
    registrationNo: 'ABN-2027-000185',
    name: 'Mehmet Kaya',
    studentNo: '202100221',
    department: 'Turizm Rehberliği',
    classYear: '2',
    eventId: 'abana-2027',
    event: 'Abana 2027',
    registeredAt: '3 Ekim 2026',
    attendance: 'Bekliyor',
    day: 'Gün 2',
    isDemoStudent: false,
    phone: '0533 000 02 21',
    email: 'ornek.mehmet@ogrenci.kastamonu.edu.tr',
    paymentCode: 'ABN-9C1M',
    paymentStatus: 'claimed',
    paymentAmount: 850,
    paidAmount: 0,
    paymentMethod: 'transfer',
    paymentNote: 'Dekont yüklendi — admin incelemesi bekleniyor',
    custodianStaffId: null,
    custodianName: null,
  },
  {
    registrationNo: 'ABN-2027-000188',
    name: 'Seda Koç',
    studentNo: '202200198',
    department: 'Turizm İşletmeciliği',
    classYear: '2',
    eventId: 'abana-2027',
    event: 'Abana 2027',
    registeredAt: '6 Ekim 2026',
    attendance: 'Bekliyor',
    day: 'Gün 2',
    isDemoStudent: false,
    phone: '0536 000 01 98',
    email: 'ornek.seda@ogrenci.kastamonu.edu.tr',
    paymentCode: 'ABN-5K3T',
    paymentStatus: 'claimed',
    paymentAmount: 850,
    paidAmount: 0,
    paymentMethod: 'transfer',
    paymentNote: 'Dekont yüklendi — admin incelemesi bekleniyor',
    custodianStaffId: null,
    custodianName: null,
  },
  {
    registrationNo: 'ABN-2027-000186',
    name: 'Elif Demir',

    studentNo: '202200044',
    department: 'Gastronomi ve Mutfak Sanatları',
    classYear: '1',
    eventId: 'abana-2027',
    event: 'Abana 2027',
    registeredAt: '4 Ekim 2026',
    attendance: 'Katıldı',
    day: 'Gün 1',
    isDemoStudent: false,
    phone: '0541 000 00 44',
    email: 'ornek.elif@ogrenci.kastamonu.edu.tr',
    paymentCode: 'ABN-4H8P',
    paymentStatus: 'partial',
    paymentAmount: 850,
    paidAmount: 400,
    paymentMethod: 'cash',
    paymentNote: 'Kısmi elden',
    custodianStaffId: 'demo-staff',
    custodianName: 'Demo Görevli',
  },
  {
    registrationNo: 'ABN-2027-000187',
    name: 'Can Öztürk',
    studentNo: '202000312',
    department: 'Turizm İşletmeciliği',
    classYear: '4',
    eventId: 'abana-2027',
    event: 'Abana 2027',
    registeredAt: '5 Ekim 2026',
    attendance: 'Bekliyor',
    day: 'Gün 1',
    isDemoStudent: false,
    phone: '0555 000 03 12',
    email: 'ornek.can@ogrenci.kastamonu.edu.tr',
    paymentCode: 'ABN-2Q6R',
    paymentStatus: 'waived',
    paymentAmount: 850,
    paidAmount: 0,
    paymentMethod: '',
    paymentNote: 'Organizasyon muafiyeti',
    custodianStaffId: null,
    custodianName: null,
  },
  {
    registrationNo: 'TNS-2026-000011',
    name: 'Zeynep Arslan',
    studentNo: '202300091',
    department: 'Turizm Rehberliği',
    classYear: '1',
    eventId: 'tanisma-2026',
    event: 'Turizm Fakültesi Tanışma',
    registeredAt: '6 Ekim 2026',
    attendance: 'Bekliyor',
    day: 'Gün 1',
    isDemoStudent: false,
    phone: '0532 111 00 11',
    email: 'ornek.zeynep@ogrenci.kastamonu.edu.tr',
    paymentCode: 'TNS-1A0B',
    paymentStatus: 'paid',
    paymentAmount: 0,
    paidAmount: 0,
    paymentMethod: '',
    paymentNote: 'Ücretsiz etkinlik',
    custodianStaffId: null,
    custodianName: null,
  },
  {
    registrationNo: 'TNS-2026-000012',
    name: 'Burak Şahin',
    studentNo: '202100155',
    department: 'Turizm İşletmeciliği',
    classYear: '2',
    eventId: 'tanisma-2026',
    event: 'Turizm Fakültesi Tanışma',
    registeredAt: '7 Ekim 2026',
    attendance: 'Katıldı',
    day: 'Gün 1',
    isDemoStudent: false,
    phone: '0544 111 00 12',
    email: 'ornek.burak@ogrenci.kastamonu.edu.tr',
    paymentCode: 'TNS-8D3E',
    paymentStatus: 'paid',
    paymentAmount: 0,
    paidAmount: 0,
    paymentMethod: '',
    paymentNote: 'Ücretsiz etkinlik',
    custodianStaffId: null,
    custodianName: null,
  },
];

export const DEMO_AUDIT = [
  {
    when: '7 Ekim 2026 21:10',
    actor: 'Demo Admin',
    action: 'Etkinlik oluşturma',
    target: 'Abana 2027',
  },
  {
    when: '7 Ekim 2026 21:24',
    actor: 'Demo Görevli',
    action: 'Check-in',
    target: 'ABN-2027-000184',
  },
  {
    when: '7 Ekim 2026 21:40',
    actor: 'Demo Admin',
    action: 'Katılımcı dışa aktarma',
    target: 'Abana 2027 · Gün 1 · Katıldı',
  },
];
