import type { AppRole } from '@/lib/auth/roles';
import { DEMO_ACCOUNTS } from '@/lib/demo/accounts';

export type DemoProfile = {
  key: string;
  fullName: string;
  email: string;
  studentNo: string | null;
  department: string | null;
  classYear: string | null;
  phone: string | null;
  role: AppRole;
};

type Store = Map<string, DemoProfile>;

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsProfileStore?: Store };
  if (!g.__emsProfileStore) {
    g.__emsProfileStore = new Map();
    for (const account of DEMO_ACCOUNTS) {
      g.__emsProfileStore.set(account.role, {
        key: account.role,
        fullName: account.fullName,
        email: account.email,
        studentNo: account.role === 'student' ? '202100184' : null,
        department: account.role === 'student' ? 'Turizm İşletmeciliği' : null,
        classYear: account.role === 'student' ? '3' : null,
        phone: account.role === 'student' ? '5551234567' : null,
        role: account.role,
      });
    }
  }
  return g.__emsProfileStore;
}

export function getDemoProfile(role: AppRole) {
  return store().get(role) ?? null;
}

export function updateDemoProfile(
  role: AppRole,
  patch: Partial<Pick<DemoProfile, 'fullName' | 'department' | 'classYear' | 'phone'>>
) {
  const current = store().get(role);
  if (!current) throw new Error('Profil bulunamadı');
  const next = {
    ...current,
    ...patch,
    studentNo: current.studentNo,
    email: current.email,
    role: current.role,
    key: current.key,
  };
  store().set(role, next);
  return next;
}
