import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { assertEmployeeTeamHasActiveBlock } from '@/lib/team-work-guard';
import type { WorkLogRow } from '@/lib/work-log-service';

const SESSION_PREFIX = 'YOK-';
const PERSONAL_PREFIX = 'PER-';
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeAttendanceToken(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const match = text.match(/(YOK|PER)-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
}

export function isPersonalAttendanceToken(token: string) {
  return token.toUpperCase().startsWith(PERSONAL_PREFIX);
}

export function parseAttendanceTokenFromQr(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const t = url.searchParams.get('t') ?? url.searchParams.get('token');
    if (t) return normalizeAttendanceToken(t);
  } catch {
    // düz metin
  }

  return normalizeAttendanceToken(text);
}

export function buildAttendanceQrUrl(token: string, origin?: string) {
  const base =
    origin ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? 'https://crewledger.vercel.app');
  return `${base.replace(/\/$/, '')}/personnel-panel/yoklama?t=${encodeURIComponent(token)}`;
}

function generateTokenBody(length = 12) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TOKEN_CHARS[bytes[i]! % TOKEN_CHARS.length];
  }
  return out;
}

export function generateSessionAttendanceToken() {
  return `${SESSION_PREFIX}${generateTokenBody(12)}`;
}

export function generatePersonalAttendanceToken() {
  return `${PERSONAL_PREFIX}${generateTokenBody(12)}`;
}

export type AttendanceQrRow = {
  id: string;
  project_id: string;
  work_date: string;
  token: string;
  is_active: boolean;
  created_at: string;
};

export type PersonalAttendanceTokenRow = {
  id: string;
  project_id: string;
  employee_id: string;
  work_date: string;
  token: string;
  is_active: boolean;
  created_at: string;
};

export type AttendanceCheckInRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  created_at: string;
  work_log_id: string;
  source: 'session' | 'personal';
};

const SESSION_QR_SELECT = 'id, project_id, work_date, token, is_active, created_at';
const PERSONAL_SELECT =
  'id, project_id, employee_id, work_date, token, is_active, created_at';

// ─── Usta sıra QR (YOK-) ───────────────────────────────────────────────────

export async function getActiveAttendanceQr(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<AttendanceQrRow | null> {
  const date = workDate.slice(0, 10);
  const { data } = await admin
    .from('project_daily_attendance_qr')
    .select(SESSION_QR_SELECT)
    .eq('project_id', projectId)
    .eq('work_date', date)
    .eq('is_active', true)
    .maybeSingle();

  return (data as AttendanceQrRow | null) ?? null;
}

async function revokeActiveSessionQrsForDate(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
) {
  const now = new Date().toISOString();
  await admin
    .from('project_daily_attendance_qr')
    .update({ is_active: false, revoked_at: now })
    .eq('project_id', projectId)
    .eq('work_date', workDate.slice(0, 10))
    .eq('is_active', true);
}

export async function createActiveAttendanceQr(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; createdBy?: string | null }
): Promise<AttendanceQrRow> {
  await revokeActiveSessionQrsForDate(admin, params.projectId, params.workDate);
  return insertActiveSessionQr(admin, params);
}

async function insertActiveSessionQr(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; createdBy?: string | null }
): Promise<AttendanceQrRow> {
  const workDate = params.workDate.slice(0, 10);

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateSessionAttendanceToken();
    const { data, error } = await admin
      .from('project_daily_attendance_qr')
      .insert({
        project_id: params.projectId,
        work_date: workDate,
        token,
        is_active: true,
        created_by: params.createdBy ?? null,
      })
      .select(SESSION_QR_SELECT)
      .single();

    if (!error && data) return data as AttendanceQrRow;
    if (error?.code !== '23505') break;
  }

  throw new Error('Yoklama QR kodu oluşturulamadı');
}

export async function getOrCreateTodayAttendanceQr(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; createdBy?: string | null }
): Promise<AttendanceQrRow> {
  const active = await getActiveAttendanceQr(admin, params.projectId, params.workDate);
  if (active) return active;
  return createActiveAttendanceQr(admin, params);
}

async function loadActiveSessionQrByToken(admin: SupabaseClient, token: string) {
  const normalized = normalizeAttendanceToken(token);
  if (!normalized || isPersonalAttendanceToken(normalized)) return null;

  const { data } = await admin
    .from('project_daily_attendance_qr')
    .select(SESSION_QR_SELECT)
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  return (data as AttendanceQrRow | null) ?? null;
}

async function spawnNextSessionQr(admin: SupabaseClient, usedQr: AttendanceQrRow) {
  return insertActiveSessionQr(admin, {
    projectId: usedQr.project_id,
    workDate: usedQr.work_date,
  });
}

// ─── Kişisel kod (PER-) ─────────────────────────────────────────────────────

export async function getActivePersonalToken(
  admin: SupabaseClient,
  employeeId: string,
  workDate: string
): Promise<PersonalAttendanceTokenRow | null> {
  const { data } = await admin
    .from('personnel_attendance_tokens')
    .select(PERSONAL_SELECT)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate.slice(0, 10))
    .eq('is_active', true)
    .maybeSingle();

  return (data as PersonalAttendanceTokenRow | null) ?? null;
}

async function revokeActivePersonalTokens(
  admin: SupabaseClient,
  employeeId: string,
  workDate: string
) {
  const now = new Date().toISOString();
  await admin
    .from('personnel_attendance_tokens')
    .update({ is_active: false, used_at: now })
    .eq('employee_id', employeeId)
    .eq('work_date', workDate.slice(0, 10))
    .eq('is_active', true);
}

async function insertPersonalToken(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    workDate: string;
    createdBy?: string | null;
  }
): Promise<PersonalAttendanceTokenRow> {
  const workDate = params.workDate.slice(0, 10);

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generatePersonalAttendanceToken();
    const { data, error } = await admin
      .from('personnel_attendance_tokens')
      .insert({
        project_id: params.projectId,
        employee_id: params.employeeId,
        work_date: workDate,
        token,
        is_active: true,
        created_by: params.createdBy ?? null,
      })
      .select(PERSONAL_SELECT)
      .single();

    if (!error && data) return data as PersonalAttendanceTokenRow;
    if (error?.code !== '23505') break;
  }

  throw new Error('Kişisel yoklama kodu oluşturulamadı');
}

/** Personel uygulaması: aktif kişisel kod yoksa oluştur */
export async function getOrCreatePersonalAttendanceToken(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    workDate: string;
    createdBy?: string | null;
  }
): Promise<PersonalAttendanceTokenRow | null> {
  const workDate = params.workDate.slice(0, 10);
  const existing = await findWorkLog(admin, params.employeeId, workDate);
  if (existing?.approved) return null;

  const active = await getActivePersonalToken(admin, params.employeeId, workDate);
  if (active) return active;

  return insertPersonalToken(admin, params);
}

/** Usta: geçmiş gün / unutulan yoklama için yeni kişisel kod */
export async function regeneratePersonalAttendanceToken(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    workDate: string;
    createdBy?: string | null;
  }
): Promise<PersonalAttendanceTokenRow> {
  await revokeActivePersonalTokens(admin, params.employeeId, params.workDate);
  return insertPersonalToken(admin, params);
}

async function loadActivePersonalTokenByToken(admin: SupabaseClient, token: string) {
  const normalized = normalizeAttendanceToken(token);
  if (!normalized || !isPersonalAttendanceToken(normalized)) return null;

  const { data } = await admin
    .from('personnel_attendance_tokens')
    .select(PERSONAL_SELECT)
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  return (data as PersonalAttendanceTokenRow | null) ?? null;
}

// ─── Ortak ──────────────────────────────────────────────────────────────────

export async function listAttendanceCheckInsForDate(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<AttendanceCheckInRow[]> {
  const date = workDate.slice(0, 10);
  const { data, error } = await admin
    .from('work_logs')
    .select(
      `
      id,
      employee_id,
      employee_confirmed_at,
      description,
      employees!inner(name)
    `
    )
    .eq('project_id', projectId)
    .eq('date', date)
    .not('employee_confirmed_at', 'is', null)
    .not('admin_confirmed_at', 'is', null)
    .order('employee_confirmed_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const emp = row.employees as { name: string } | { name: string }[] | null;
    const name = Array.isArray(emp) ? emp[0]?.name : emp?.name;
    const desc = (row.description as string | null) ?? '';
    return {
      id: row.id as string,
      employee_id: row.employee_id as string,
      employee_name: name ?? 'Personel',
      work_log_id: row.id as string,
      created_at: (row.employee_confirmed_at as string) ?? new Date().toISOString(),
      source: desc.includes('Kişisel') ? 'personal' : 'session',
    };
  });
}

async function findWorkLog(
  admin: SupabaseClient,
  employeeId: string,
  date: string
): Promise<WorkLogRow | null> {
  const { data } = await admin
    .from('work_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();
  return (data as WorkLogRow | null) ?? null;
}

async function upsertApprovedWorkLog(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    workDate: string;
    description: string;
  }
): Promise<WorkLogRow> {
  const now = new Date().toISOString();
  const existing = await findWorkLog(admin, params.employeeId, params.workDate);

  if (existing?.approved) {
    throw new Error(
      `${dayjs(params.workDate).format('DD.MM.YYYY')} için yoklamanız zaten kayıtlı`
    );
  }

  if (existing) {
    const { data, error } = await admin
      .from('work_logs')
      .update({
        amount: 1,
        admin_confirmed_at: existing.admin_confirmed_at ?? now,
        employee_confirmed_at: now,
        employee_dispute_note: null,
        employee_disputed_at: null,
        description: params.description,
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as WorkLogRow;
  }

  const { data, error } = await admin
    .from('work_logs')
    .insert({
      project_id: params.projectId,
      employee_id: params.employeeId,
      date: params.workDate,
      amount: 1,
      mesai_type: 'none',
      mesai_units: 0,
      description: params.description,
      admin_confirmed_at: now,
      employee_confirmed_at: now,
      approved_by: null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        `${dayjs(params.workDate).format('DD.MM.YYYY')} için yoklamanız zaten kayıtlı`
      );
    }
    throw new Error(error.message);
  }

  return data as WorkLogRow;
}

/** Usta sıra QR — tek kullanımlık, giriş yapan personele yazar */
async function checkInViaSessionQr(
  admin: SupabaseClient,
  params: { token: string; employeeId: string; projectId: string }
): Promise<{ workLog: WorkLogRow; workDate: string }> {
  const qr = await loadActiveSessionQrByToken(admin, params.token);
  if (!qr) {
    throw new Error('Geçersiz veya kullanılmış usta QR kodu. Ustadan güncel kodu alın.');
  }

  if (qr.project_id !== params.projectId) {
    throw new Error('Bu QR kodu sizin projenize ait değil');
  }

  const now = new Date().toISOString();
  const { data: claimed } = await admin
    .from('project_daily_attendance_qr')
    .update({ is_active: false, revoked_at: now })
    .eq('id', qr.id)
    .eq('is_active', true)
    .select('id')
    .maybeSingle();

  if (!claimed) {
    throw new Error('Geçersiz veya kullanılmış usta QR kodu. Ustadan güncel kodu alın.');
  }

  await assertEmployeeTeamHasActiveBlock(admin, params.employeeId, params.projectId);

  let workLog: WorkLogRow;
  try {
    workLog = await upsertApprovedWorkLog(admin, {
      projectId: params.projectId,
      employeeId: params.employeeId,
      workDate: qr.work_date,
      description: 'QR yoklama',
    });
  } catch (err) {
    await spawnNextSessionQr(admin, qr);
    throw err;
  }

  await admin.from('attendance_qr_checkins').insert({
    qr_id: qr.id,
    employee_id: params.employeeId,
    work_log_id: workLog.id,
  });

  await spawnNextSessionQr(admin, qr);

  return { workLog, workDate: qr.work_date };
}

/** Kişisel kod — yalnızca kod sahibi personelin hesabında geçerli */
async function checkInViaPersonalToken(
  admin: SupabaseClient,
  params: { token: string; employeeId: string; projectId: string }
): Promise<{ workLog: WorkLogRow; workDate: string }> {
  const personal = await loadActivePersonalTokenByToken(admin, params.token);
  if (!personal) {
    throw new Error('Geçersiz veya kullanılmış kişisel kod.');
  }

  if (personal.project_id !== params.projectId) {
    throw new Error('Bu kod sizin projenize ait değil');
  }

  if (personal.employee_id !== params.employeeId) {
    throw new Error('Bu kod size ait değil. Başkasının kodunu kullanamazsınız.');
  }

  const now = new Date().toISOString();
  const { data: claimed } = await admin
    .from('personnel_attendance_tokens')
    .update({ is_active: false, used_at: now })
    .eq('id', personal.id)
    .eq('is_active', true)
    .select('id')
    .maybeSingle();

  if (!claimed) {
    throw new Error('Geçersiz veya kullanılmış kişisel kod.');
  }

  await assertEmployeeTeamHasActiveBlock(admin, params.employeeId, params.projectId);

  const workLog = await upsertApprovedWorkLog(admin, {
    projectId: params.projectId,
    employeeId: params.employeeId,
    workDate: personal.work_date,
    description: 'Kişisel kod yoklama',
  });

  await admin.from('personnel_attendance_checkins').insert({
    token_id: personal.id,
    employee_id: params.employeeId,
    work_log_id: workLog.id,
  });

  return { workLog, workDate: personal.work_date };
}

export async function checkInViaAttendanceQr(
  admin: SupabaseClient,
  params: { token: string; employeeId: string; projectId: string }
): Promise<{ workLog: WorkLogRow; workDate: string }> {
  const normalized = normalizeAttendanceToken(params.token);
  if (!normalized) {
    throw new Error('Geçersiz yoklama kodu');
  }

  if (isPersonalAttendanceToken(normalized)) {
    return checkInViaPersonalToken(admin, { ...params, token: normalized });
  }

  return checkInViaSessionQr(admin, { ...params, token: normalized });
}

// Geriye dönük uyumluluk
export function generateAttendanceToken() {
  return generateSessionAttendanceToken();
}

export async function loadActiveAttendanceQrByToken(admin: SupabaseClient, token: string) {
  return loadActiveSessionQrByToken(admin, token);
}

export async function getOrCreateDailyAttendanceQr(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; createdBy?: string | null }
) {
  return getOrCreateTodayAttendanceQr(admin, params);
}
