import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertEmployeeTeamHasActiveBlock } from '@/lib/team-work-guard';
import type { WorkLogRow } from '@/lib/work-log-service';

const TOKEN_PREFIX = 'YOK-';
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeAttendanceToken(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const match = text.match(/YOK-[A-Z0-9]{10,14}/);
  return match ? match[0] : null;
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

export function generateAttendanceToken() {
  return `${TOKEN_PREFIX}${generateTokenBody(12)}`;
}

export type AttendanceSessionRow = {
  id: string;
  project_id: string;
  work_date: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
};

export type AttendanceQrRow = {
  id: string;
  project_id: string;
  work_date: string;
  token: string;
  is_active: boolean;
  session_id: string | null;
  created_at: string;
};

export type AttendanceCheckInRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  created_at: string;
  work_log_id: string | null;
  yevmiye_kayitli: boolean;
};

const SESSION_SELECT = 'id, project_id, work_date, status, started_at, completed_at';
const QR_SELECT =
  'id, project_id, work_date, token, is_active, session_id, created_at';

export async function getActiveSession(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<AttendanceSessionRow | null> {
  const { data } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('project_id', projectId)
    .eq('work_date', workDate.slice(0, 10))
    .eq('status', 'active')
    .maybeSingle();

  return (data as AttendanceSessionRow | null) ?? null;
}

export async function getSessionForDate(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<AttendanceSessionRow | null> {
  const active = await getActiveSession(admin, projectId, workDate);
  if (active) return active;

  const { data } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('project_id', projectId)
    .eq('work_date', workDate.slice(0, 10))
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as AttendanceSessionRow | null) ?? null;
}

export async function getActiveAttendanceQr(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
): Promise<AttendanceQrRow | null> {
  const session = await getActiveSession(admin, projectId, workDate);
  if (!session) return null;

  const { data } = await admin
    .from('project_daily_attendance_qr')
    .select(QR_SELECT)
    .eq('session_id', session.id)
    .eq('is_active', true)
    .maybeSingle();

  return (data as AttendanceQrRow | null) ?? null;
}

async function revokeSessionQrs(admin: SupabaseClient, sessionId: string) {
  const now = new Date().toISOString();
  await admin
    .from('project_daily_attendance_qr')
    .update({ is_active: false, revoked_at: now })
    .eq('session_id', sessionId)
    .eq('is_active', true);
}

async function insertSessionQr(
  admin: SupabaseClient,
  params: {
    projectId: string;
    workDate: string;
    sessionId: string;
    createdBy?: string | null;
  }
): Promise<AttendanceQrRow> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateAttendanceToken();
    const { data, error } = await admin
      .from('project_daily_attendance_qr')
      .insert({
        project_id: params.projectId,
        work_date: params.workDate.slice(0, 10),
        session_id: params.sessionId,
        token,
        is_active: true,
        created_by: params.createdBy ?? null,
      })
      .select(QR_SELECT)
      .single();

    if (!error && data) return data as AttendanceQrRow;
    if (error?.code !== '23505') break;
  }

  throw new Error('Yoklama QR kodu oluşturulamadı');
}

/** Usta: yoklama oturumunu başlat */
export async function startAttendanceSession(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; startedBy?: string | null }
): Promise<{ session: AttendanceSessionRow; qr: AttendanceQrRow }> {
  const workDate = params.workDate.slice(0, 10);

  const existing = await getActiveSession(admin, params.projectId, workDate);
  if (existing) {
    const qr = await getActiveAttendanceQr(admin, params.projectId, workDate);
    if (qr) return { session: existing, qr };
    const newQr = await insertSessionQr(admin, {
      projectId: params.projectId,
      workDate,
      sessionId: existing.id,
      createdBy: params.startedBy,
    });
    return { session: existing, qr: newQr };
  }

  const { data: session, error } = await admin
    .from('attendance_sessions')
    .insert({
      project_id: params.projectId,
      work_date: workDate,
      status: 'active',
      started_by: params.startedBy ?? null,
    })
    .select(SESSION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const qr = await insertSessionQr(admin, {
    projectId: params.projectId,
    workDate,
    sessionId: session.id,
    createdBy: params.startedBy,
  });

  return { session: session as AttendanceSessionRow, qr };
}

export async function listSessionCheckIns(
  admin: SupabaseClient,
  sessionId: string
): Promise<AttendanceCheckInRow[]> {
  const { data, error } = await admin
    .from('attendance_session_checkins')
    .select(
      `
      id,
      employee_id,
      scanned_at,
      work_log_id,
      employees!inner(name)
    `
    )
    .eq('session_id', sessionId)
    .order('scanned_at', { ascending: false });

  if (error) {
    if (error.message.includes('attendance_session_checkins')) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const emp = row.employees as { name: string } | { name: string }[] | null;
    const name = Array.isArray(emp) ? emp[0]?.name : emp?.name;
    return {
      id: row.id as string,
      employee_id: row.employee_id as string,
      employee_name: name ?? 'Personel',
      work_log_id: (row.work_log_id as string | null) ?? null,
      created_at: row.scanned_at as string,
      yevmiye_kayitli: Boolean(row.work_log_id),
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

async function createApprovedWorkLog(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    workDate: string;
  }
): Promise<WorkLogRow> {
  const now = new Date().toISOString();
  const existing = await findWorkLog(admin, params.employeeId, params.workDate);

  if (existing?.approved) {
    return existing;
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
        description: 'QR yoklama',
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
      description: 'QR yoklama',
      admin_confirmed_at: now,
      employee_confirmed_at: now,
      approved_by: null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const retry = await findWorkLog(admin, params.employeeId, params.workDate);
      if (retry) return retry;
    }
    throw new Error(error.message);
  }

  return data as WorkLogRow;
}

async function loadActiveQrByToken(admin: SupabaseClient, token: string) {
  const normalized = normalizeAttendanceToken(token);
  if (!normalized) return null;

  const { data } = await admin
    .from('project_daily_attendance_qr')
    .select(QR_SELECT)
    .eq('token', normalized)
    .eq('is_active', true)
    .maybeSingle();

  return (data as AttendanceQrRow | null) ?? null;
}

/** Personel QR okutunca listeye eklenir; yevmiye usta bitirince yazılır */
export async function scanAttendanceQr(
  admin: SupabaseClient,
  params: { token: string; employeeId: string; projectId: string }
): Promise<{ workDate: string; employeeName: string; alreadyListed: boolean }> {
  const qr = await loadActiveQrByToken(admin, params.token);
  if (!qr) {
    throw new Error('Geçersiz veya kullanılmış QR. Ustadan güncel kodu isteyin.');
  }

  if (qr.project_id !== params.projectId) {
    throw new Error('Bu QR kodu sizin projenize ait değil');
  }

  if (!qr.session_id) {
    throw new Error('Yoklama oturumu aktif değil');
  }

  const { data: session } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('id', qr.session_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!session) {
    throw new Error('Yoklama oturumu kapalı. Usta yoklamayı bitirmiş olabilir.');
  }

  await assertEmployeeTeamHasActiveBlock(admin, params.employeeId, params.projectId);

  const { data: employee } = await admin
    .from('employees')
    .select('name')
    .eq('id', params.employeeId)
    .maybeSingle();

  const employeeName = (employee?.name as string) ?? 'Personel';

  const { data: existingCheckin } = await admin
    .from('attendance_session_checkins')
    .select('id')
    .eq('session_id', qr.session_id)
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (existingCheckin) {
    await rotateSessionQr(admin, qr);
    return {
      workDate: qr.work_date,
      employeeName,
      alreadyListed: true,
    };
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
    throw new Error('Geçersiz veya kullanılmış QR. Ustadan güncel kodu isteyin.');
  }

  const { error: checkinError } = await admin.from('attendance_session_checkins').insert({
    session_id: qr.session_id,
    employee_id: params.employeeId,
  });

  if (checkinError) {
    if (checkinError.code === '23505') {
      await rotateSessionQr(admin, qr);
      return { workDate: qr.work_date, employeeName, alreadyListed: true };
    }
    throw new Error(checkinError.message);
  }

  await rotateSessionQr(admin, qr);

  return { workDate: qr.work_date, employeeName, alreadyListed: false };
}

async function rotateSessionQr(admin: SupabaseClient, usedQr: AttendanceQrRow) {
  if (!usedQr.session_id) return;
  await insertSessionQr(admin, {
    projectId: usedQr.project_id,
    workDate: usedQr.work_date,
    sessionId: usedQr.session_id,
  });
}

/** Usta: yoklamayı bitir — listedekilerin yevmiyesini yazar */
export async function completeAttendanceSession(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; completedBy?: string | null }
): Promise<{ count: number; session: AttendanceSessionRow }> {
  const workDate = params.workDate.slice(0, 10);
  const session = await getActiveSession(admin, params.projectId, workDate);

  if (!session) {
    throw new Error('Aktif yoklama oturumu yok');
  }

  const checkIns = await listSessionCheckIns(admin, session.id);
  const now = new Date().toISOString();
  let count = 0;

  for (const checkIn of checkIns) {
    if (checkIn.work_log_id) {
      count += 1;
      continue;
    }

    const workLog = await createApprovedWorkLog(admin, {
      projectId: params.projectId,
      employeeId: checkIn.employee_id,
      workDate,
    });

    await admin
      .from('attendance_session_checkins')
      .update({ work_log_id: workLog.id })
      .eq('id', checkIn.id);

    count += 1;
  }

  await revokeSessionQrs(admin, session.id);

  const { data: completed, error } = await admin
    .from('attendance_sessions')
    .update({
      status: 'completed',
      completed_at: now,
      completed_by: params.completedBy ?? null,
    })
    .eq('id', session.id)
    .select(SESSION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return { count, session: completed as AttendanceSessionRow };
}

/** Usta: aktif yoklamayı iptal et — yevmiye yazılmaz */
export async function cancelAttendanceSession(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; cancelledBy?: string | null }
): Promise<void> {
  const workDate = params.workDate.slice(0, 10);
  const session = await getActiveSession(admin, params.projectId, workDate);

  if (!session) {
    throw new Error('İptal edilecek aktif yoklama yok');
  }

  const now = new Date().toISOString();
  await revokeSessionQrs(admin, session.id);

  await admin.from('attendance_session_checkins').delete().eq('session_id', session.id);

  const { error } = await admin
    .from('attendance_sessions')
    .update({
      status: 'cancelled',
      completed_at: now,
      completed_by: params.cancelledBy ?? null,
    })
    .eq('id', session.id);

  if (error) throw new Error(error.message);
}

/** Listeden personel kaldır (yalnızca aktif oturum, yevmiye yazılmadan önce) */
export async function removeSessionCheckIn(
  admin: SupabaseClient,
  params: { projectId: string; checkInId: string }
): Promise<void> {
  const { data: checkIn } = await admin
    .from('attendance_session_checkins')
    .select('id, session_id, work_log_id, attendance_sessions!inner(project_id, status)')
    .eq('id', params.checkInId)
    .maybeSingle();

  if (!checkIn) {
    throw new Error('Kayıt bulunamadı');
  }

  const sessionRaw = checkIn.attendance_sessions as
    | { project_id: string; status: string }
    | { project_id: string; status: string }[];
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;

  if (!session || session.project_id !== params.projectId) {
    throw new Error('Kayıt bulunamadı');
  }

  if (session.status !== 'active') {
    throw new Error('Yalnızca devam eden yoklamadan kaldırılabilir');
  }

  if (checkIn.work_log_id) {
    throw new Error('Yevmiyesi yazılmış kayıt kaldırılamaz');
  }

  const { error } = await admin
    .from('attendance_session_checkins')
    .delete()
    .eq('id', params.checkInId);

  if (error) throw new Error(error.message);
}

// Geriye dönük export
export async function checkInViaAttendanceQr(
  admin: SupabaseClient,
  params: { token: string; employeeId: string; projectId: string }
) {
  const result = await scanAttendanceQr(admin, params);
  return { workDate: result.workDate, alreadyListed: result.alreadyListed };
}

export async function loadActiveAttendanceQrByToken(admin: SupabaseClient, token: string) {
  return loadActiveQrByToken(admin, token);
}
