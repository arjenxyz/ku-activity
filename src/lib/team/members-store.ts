import { DEMO_ACCOUNTS } from '@/lib/demo/accounts';
import { TEAM_MEMBERS } from '@/lib/team';
import { getTeamSnapshot } from '@/lib/team/team-store';

export type StoredTeamMember = {
  id: string;
  name: string;
  handle: string;
  role: string;
  about: string;
  image?: string | null;
  profileKey: string | null;
  sortOrder: number;
  active: boolean;
};

export type AssignablePerson = {
  id: string;
  fullName: string;
  email: string;
  source: 'account' | 'application';
};

type Store = {
  members: StoredTeamMember[];
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function slugHandle(name: string) {
  const base = name
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);
  return `@${base || 'uye'}`;
}

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsTeamMembersV1?: Store };
  if (!g.__emsTeamMembersV1) {
    g.__emsTeamMembersV1 = {
      members: TEAM_MEMBERS.map((row, index) => ({
        id: `member_seed_${index + 1}`,
        name: row.name,
        handle: row.handle,
        role: row.role,
        about: row.about,
        image: row.image ?? null,
        profileKey: null,
        sortOrder: index,
        active: true,
      })),
    };
  }
  return g.__emsTeamMembersV1;
}

export function listPublicTeamMembers() {
  return store()
    .members.filter((row) => row.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ ...row }));
}

export function listAllTeamMembers() {
  return store()
    .members.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({ ...row }));
}

export function listAssignablePeople(): AssignablePerson[] {
  const taken = new Set(
    store()
      .members.filter((row) => row.active && row.profileKey)
      .map((row) => row.profileKey as string)
  );

  const fromAccounts: AssignablePerson[] = DEMO_ACCOUNTS.filter(
    (account) => !taken.has(account.role) && !taken.has(account.email)
  ).map((account) => ({
    id: `account:${account.role}`,
    fullName: account.fullName,
    email: account.email,
    source: 'account' as const,
  }));

  const fromApps: AssignablePerson[] = getTeamSnapshot()
    .applications.filter((app) => app.status === 'accepted')
    .filter((app) => !taken.has(app.profileId) && !taken.has(app.email))
    .map((app) => ({
      id: `app:${app.profileId}`,
      fullName: app.fullName,
      email: app.email,
      source: 'application' as const,
    }));

  // Dedupe by email
  const seen = new Set<string>();
  const out: AssignablePerson[] = [];
  for (const row of [...fromAccounts, ...fromApps]) {
    const key = row.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function createManualTeamMember(input: {
  name: string;
  handle?: string;
  role?: string;
  about?: string;
}) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error('İsim en az 2 karakter olmalı');
  const handle = (input.handle?.trim() || slugHandle(name)).replace(/\s+/g, '');
  const normalized = handle.startsWith('@') ? handle : `@${handle}`;
  if (store().members.some((row) => row.active && row.handle.toLowerCase() === normalized.toLowerCase())) {
    throw new Error('Bu kullanıcı adı zaten var');
  }
  const maxOrder = store().members.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  const row: StoredTeamMember = {
    id: uid('member'),
    name,
    handle: normalized,
    role: (input.role ?? '').trim() || 'Ekip üyesi',
    about: (input.about ?? '').trim() || `${name} ekip üyesi.`,
    image: null,
    profileKey: null,
    sortOrder: maxOrder + 1,
    active: true,
  };
  store().members.push(row);
  return { ...row };
}

export function assignTeamMemberFromPerson(input: {
  personId: string;
  role?: string;
  about?: string;
}) {
  const people = listAssignablePeople();
  const person = people.find((row) => row.id === input.personId);
  if (!person) throw new Error('Atanacak kişi bulunamadı veya zaten ekipte');

  const profileKey = person.id.includes(':')
    ? person.id.split(':').slice(1).join(':')
    : person.id;

  if (
    store().members.some(
      (row) =>
        row.active &&
        (row.profileKey === profileKey ||
          row.handle.toLowerCase() === slugHandle(person.fullName).toLowerCase())
    )
  ) {
    throw new Error('Bu kişi zaten ekipte');
  }

  let handle = slugHandle(person.fullName);
  if (store().members.some((row) => row.active && row.handle.toLowerCase() === handle.toLowerCase())) {
    handle = `${handle}${Math.random().toString(36).slice(2, 4)}`;
  }

  const maxOrder = store().members.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  const row: StoredTeamMember = {
    id: uid('member'),
    name: person.fullName.split(/\s+/)[0] || person.fullName,
    handle,
    role: (input.role ?? '').trim() || 'Ekip üyesi',
    about:
      (input.about ?? '').trim() ||
      `${person.fullName} kayıtlı kullanıcıdan ekibe atandı.`,
    image: null,
    profileKey,
    sortOrder: maxOrder + 1,
    active: true,
  };
  store().members.push(row);
  return { ...row };
}

export function updateTeamMember(
  id: string,
  patch: Partial<Pick<StoredTeamMember, 'name' | 'handle' | 'role' | 'about' | 'image' | 'active'>>
) {
  const row = store().members.find((item) => item.id === id);
  if (!row) throw new Error('Üye bulunamadı');
  if (patch.name != null) {
    const name = patch.name.trim();
    if (name.length < 2) throw new Error('İsim en az 2 karakter olmalı');
    row.name = name;
  }
  if (patch.handle != null) {
    const handle = patch.handle.trim().replace(/\s+/g, '');
    const normalized = handle.startsWith('@') ? handle : `@${handle}`;
    if (
      store().members.some(
        (item) =>
          item.id !== id &&
          item.active &&
          item.handle.toLowerCase() === normalized.toLowerCase()
      )
    ) {
      throw new Error('Bu kullanıcı adı zaten var');
    }
    row.handle = normalized;
  }
  if (patch.role != null) row.role = patch.role.trim() || row.role;
  if (patch.about != null) row.about = patch.about.trim() || row.about;
  if (patch.image !== undefined) row.image = patch.image;
  if (patch.active != null) row.active = patch.active;
  return { ...row };
}

export function removeTeamMember(id: string) {
  const row = store().members.find((item) => item.id === id);
  if (!row) throw new Error('Üye bulunamadı');
  row.active = false;
  return { ok: true };
}
