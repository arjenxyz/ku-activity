const STORAGE_PASSWORDS = 'ems-password-overrides';
const STORAGE_SIGNUPS = 'ems-signups';

export type LocalSignup = {
  email: string;
  password: string;
  fullName: string;
  studentNo: string;
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
  return readJson<LocalSignup[]>(STORAGE_SIGNUPS, []);
}

export function saveSignup(signup: LocalSignup) {
  const next = listSignups().filter((item) => item.email !== signup.email.trim().toLowerCase());
  next.push({ ...signup, email: signup.email.trim().toLowerCase() });
  localStorage.setItem(STORAGE_SIGNUPS, JSON.stringify(next));
}

export function findSignup(email: string, password: string): LocalSignup | null {
  const key = email.trim().toLowerCase();
  return listSignups().find((item) => item.email === key && item.password === password) ?? null;
}
