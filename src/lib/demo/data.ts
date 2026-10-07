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
  event: string;
  registeredAt: string;
  attendance: 'Katıldı' | 'Bekliyor';
  day: string;
  isDemoStudent: boolean;
};

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
    event: 'Abana 2027',
    registeredAt: '2 Ekim 2026',
    attendance: 'Katıldı',
    day: 'Gün 1',
    isDemoStudent: true,
  },
  {
    registrationNo: 'ABN-2027-000185',
    name: 'Mehmet Kaya',
    studentNo: '202100221',
    department: 'Turizm Rehberliği',
    classYear: '2',
    event: 'Abana 2027',
    registeredAt: '3 Ekim 2026',
    attendance: 'Bekliyor',
    day: 'Gün 2',
    isDemoStudent: false,
  },
  {
    registrationNo: 'ABN-2027-000186',
    name: 'Elif Demir',
    studentNo: '202200044',
    department: 'Gastronomi ve Mutfak Sanatları',
    classYear: '1',
    event: 'Abana 2027',
    registeredAt: '4 Ekim 2026',
    attendance: 'Katıldı',
    day: 'Gün 1',
    isDemoStudent: false,
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
