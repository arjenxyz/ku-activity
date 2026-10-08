const STORAGE_PASSWORDS = 'ems-password-overrides';
const STORAGE_SIGNUPS = 'ems-signups';

export type SignupStatus = 'pending' | 'approved';

export type LocalSignup = {
  email: string;
  password: string;
  fullName: string;
  studentNo: string;
  approvalCode: string;
  status: SignupStatus;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSignups(signups: LocalSignup[]) {
  localStorage.setItem(STORAGE_SIGNUPS, JSON.stringify(signups));
  window.dispatchEvent(new Event('ems-signups'));
}

export function createApprovalCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let body = '';
  for (const byte of bytes) body += alphabet[byte % alphabet.length];
  return `KU-${body}`;
}

export function passwordOverride(email: string): string | null {
  const map = readJson<Record<string, string>>(STORAGE_PASSWORDS, {});
  return map[email.trim().toLowerCase()] ?? null;
}

export function savePasswordOverride(email: string, password: string) {
  const key = email.trim().toLowerCase();
  const map = readJson<Record<string, string>>(STORAGE_PASSWORDS, {});
  map[key] = password;
  localStorage.setItem(STORAGE_PASSWORDS, JSON.stringify(map));
}

export function listSignups(): LocalSignup[] {
  return readJson<LocalSignup[]>(STORAGE_SIGNUPS, []).map((item) => ({
    ...item,
    approvalCode: item.approvalCode || 'KU-DEMO',
    status: item.status || 'approved',
  }));
}

export function saveSignup(signup: Omit<LocalSignup, 'approvalCode' | 'status'>): LocalSignup {
  const email = signup.email.trim().toLowerCase();
  const record: LocalSignup = {
    ...signup,
    email,
    approvalCode: createApprovalCode(),
    status: 'pending',
  };
  const next = listSignups().filter((item) => item.email !== email);
  next.push(record);
  writeSignups(next);
  return record;
}

export function findSignup(email: string, password: string): LocalSignup | null {
  const key = email.trim().toLowerCase();
  return (
    listSignups().find(
      (item) => item.email === key && item.password === password && item.status === 'approved'
    ) ?? null
  );
}

export function findSignupByEmail(email: string): LocalSignup | null {
  const key = email.trim().toLowerCase();
  return listSignups().find((item) => item.email === key) ?? null;
}

export function approveSignupCode(code: string): LocalSignup | null {
  const normalized = code.trim().toUpperCase();
  const signups = listSignups();
  const match = signups.find((item) => item.approvalCode.toUpperCase() === normalized);
  if (!match || match.status === 'approved') return match ?? null;
  match.status = 'approved';
  writeSignups(signups);
  return match;
}
