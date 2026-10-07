import type { AppRole } from '@/lib/auth/roles';

export const DEMO_PASSWORD = 'Demo1234';

export type DemoAccount = {
  email: string;
  password: string;
  role: AppRole;
  label: string;
  fullName: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@demo.local',
    password: DEMO_PASSWORD,
    role: 'admin',
    label: 'Admin',
    fullName: 'Demo Admin',
  },
  {
    email: 'staff@demo.local',
    password: DEMO_PASSWORD,
    role: 'staff',
    label: 'Görevli',
    fullName: 'Demo Görevli',
  },
  {
    email: 'ogrenci@demo.local',
    password: DEMO_PASSWORD,
    role: 'student',
    label: 'Öğrenci',
    fullName: 'Ayşe Yılmaz',
  },
];

export function findDemoAccount(email: string, password: string): DemoAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find(
      (account) => account.email === normalized && account.password === password
    ) ?? null
  );
}
