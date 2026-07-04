import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  assertAttendanceWindowOpen,
  getAttendanceWindowStatus,
  loadProjectAttendanceSchedule,
} from '@/lib/attendance-window';
import {
  clearAttendanceNotices,
  getLatestAttendanceNotice,
  recordAttendanceNotice,
} from '@/lib/attendance-notices';
import {
  ATTENDANCE_MESSAGE_CODES,
  AttendanceScanError,
  type AttendanceLocale,
  type AttendanceMessageCode,
  tAttendance,
} from '@/lib/i18n/attendance-messages';
import { assertEmployeeTeamHasActiveBlock } from '@/lib/team-work-guard';
import type { WorkLogRow } from '@/lib/work-log-service';
import strings from '@json/src/lib/attendance-qr-service.json';

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

export async function getProjectAttendanceWindowStatus(
  admin: SupabaseClient,
  projectId: string,
  workDate: string
) {
  const schedule = await loadProjectAttendanceSchedule(admin, projectId);
  return getAttendanceWindowStatus(workDate, schedule);
}

export type PersonnelAttendanceState =
  | 'none'
  | 'waiting'
  | 'completed'
  | 'cancelled'
  | 'removed';

export type PersonnelAttendanceStatus = {
  workDate: string;
  state: PersonnelAttendanceState;
  listedAt: string | null;
  completedAt: string | null;
  message: string;
  messageCode?: AttendanceMessageCode;
};

/** Personelin bugünkü yoklama durumu */
export async function getPersonnelAttendanceStatus(
  admin: SupabaseClient,
  params: {
    employeeId: string;
    projectId: string;
    workDate?: string;
    locale?: AttendanceLocale;
  }
): Promise<PersonnelAttendanceStatus> {
  const workDate = (params.workDate ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const locale = params.locale ?? 'tr';

  const { data: rows } = await admin
    .from('attendance_session_checkins')
    .select(
      `
      id,
      scanned_at,
      work_log_id,
      attendance_sessions!inner(id, project_id, work_date, status, completed_at)
    `
    )
    .eq('employee_id', params.employeeId)
    .eq('attendance_sessions.project_id', params.projectId)
    .eq('attendance_sessions.work_date', workDate)
    .order('scanned_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) {
    const notice = await getLatestAttendanceNotice(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      workDate,
    });

    if (notice?.notice_type === 'session_cancelled') {
      const code = ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED;
      return {
        workDate,
        state: 'cancelled',
        listedAt: null,
        completedAt: notice.created_at,
        message: tAttendance(code, locale),
        messageCode: code,
      };
    }

    if (notice?.notice_type === 'removed_from_list') {
      const code = ATTENDANCE_MESSAGE_CODES.REMOVED_FROM_LIST;
      return {
        workDate,
        state: 'removed',
        listedAt: null,
        completedAt: null,
        message: tAttendance(code, locale),
        messageCode: code,
      };
    }

    const code = ATTENDANCE_MESSAGE_CODES.NONE;
    return {
      workDate,
      state: 'none',
      listedAt: null,
      completedAt: null,
      message: tAttendance(code, locale),
      messageCode: code,
    };
  }

  const sessionRaw = row.attendance_sessions as
    | { status: string; completed_at: string | null }
    | { status: string; completed_at: string | null }[];
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
  const listedAt = row.scanned_at as string;
  const workLogId = row.work_log_id as string | null;

  if (session?.status === 'cancelled') {
    const code = ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED;
    return {
      workDate,
      state: 'cancelled',
      listedAt,
      completedAt: session.completed_at,
      message: tAttendance(code, locale),
      messageCode: code,
    };
  }

  if (session?.status === 'completed' && workLogId) {
    const code = ATTENDANCE_MESSAGE_CODES.COMPLETED;
    return {
      workDate,
      state: 'completed',
      listedAt,
      completedAt: session.completed_at,
      message: tAttendance(code, locale),
      messageCode: code,
    };
  }

  if (session?.status === 'active') {
    const code = ATTENDANCE_MESSAGE_CODES.WAITING;
    return {
      workDate,
      state: 'waiting',
      listedAt,
      completedAt: null,
      message: tAttendance(code, locale),
      messageCode: code,
    };
  }

  const code = ATTENDANCE_MESSAGE_CODES.WAITING;
  return {
    workDate,
    state: 'waiting',
    listedAt,
    completedAt: session?.completed_at ?? null,
    message: tAttendance(code, locale),
    messageCode: code,
  };
}

/** Aynı gün önceki yoklama kaydını temizle (yeniden okutma) */
export async function clearEmployeeAttendanceForDate(
  admin: SupabaseClient,
  params: { employeeId: string; projectId: string; workDate: string }
): Promise<void> {
  const workDate = params.workDate.slice(0, 10);

  const { data: checkIns } = await admin
    .from('attendance_session_checkins')
    .select(
      `
      id,
      work_log_id,
      attendance_sessions!inner(project_id, work_date)
    `
    )
    .eq('employee_id', params.employeeId);

  const toClear = (checkIns ?? []).filter((c) => {
    const sessionRaw = c.attendance_sessions as
      | { project_id: string; work_date: string }
      | { project_id: string; work_date: string }[];
    const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
    return session?.project_id === params.projectId && session?.work_date === workDate;
  });

  const workLogIds = toClear
    .map((c) => c.work_log_id as string | null)
    .filter((id): id is string => Boolean(id));

  if (workLogIds.length > 0) {
    const { error: wlError } = await admin.from('work_logs').delete().in('id', workLogIds);
    if (wlError) throw new Error(wlError.message);
  }

  const checkInIds = toClear.map((c) => c.id as string);
  if (checkInIds.length > 0) {
    const { error } = await admin.from('attendance_session_checkins').delete().in('id', checkInIds);
    if (error) throw new Error(error.message);
  }

  await clearAttendanceNotices(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    workDate,
  });
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

  throw new Error(strings.qrCreateFailed);
}

/** Usta: yoklama oturumunu başlat */
export async function startAttendanceSession(
  admin: SupabaseClient,
  params: { projectId: string; workDate: string; startedBy?: string | null }
): Promise<{ session: AttendanceSessionRow; qr: AttendanceQrRow }> {
  const workDate = params.workDate.slice(0, 10);

  const schedule = await loadProjectAttendanceSchedule(admin, params.projectId);
  assertAttendanceWindowOpen(workDate, schedule);

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
      employee_name: name ?? strings.employeeFallback,
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
        description: strings.workLogDescription,
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
      description: strings.workLogDescription,
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

async function loadQrByTokenAnyState(admin: SupabaseClient, token: string) {
  const normalized = normalizeAttendanceToken(token);
  if (!normalized) return null;

  const { data } = await admin
    .from('project_daily_attendance_qr')
    .select(`${QR_SELECT}, session_id`)
    .eq('token', normalized)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  let sessionStatus: string | null = null;
  if (data.session_id) {
    const { data: session } = await admin
      .from('attendance_sessions')
      .select('status')
      .eq('id', data.session_id)
      .maybeSingle();
    sessionStatus = (session?.status as string) ?? null;
  }

  return {
    qr: data as AttendanceQrRow,
    sessionStatus,
  };
}

async function diagnoseInactiveQrToken(
  admin: SupabaseClient,
  token: string,
  projectId: string,
  locale: AttendanceLocale = 'tr'
): Promise<AttendanceScanError> {
  const resolved = await loadQrByTokenAnyState(admin, token);

  if (!resolved) {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.INVALID_TOKEN, locale);
  }

  const { qr, sessionStatus } = resolved;

  if (qr.project_id !== projectId) {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.WRONG_PROJECT, locale);
  }

  if (sessionStatus === 'cancelled') {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.SESSION_CANCELLED, locale);
  }

  if (sessionStatus === 'completed') {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.SESSION_COMPLETED, locale);
  }

  if (!qr.is_active && sessionStatus === 'active') {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.QR_ALREADY_USED, locale);
  }

  if (sessionStatus !== 'active') {
    return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.SESSION_CLOSED, locale);
  }

  return new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.INVALID_TOKEN, locale);
}

/** Personel QR okutunca listeye eklenir; yevmiye usta bitirince yazılır */
export async function scanAttendanceQr(
  admin: SupabaseClient,
  params: {
    token: string;
    employeeId: string;
    projectId: string;
    replacePrevious?: boolean;
    locale?: AttendanceLocale;
  }
): Promise<{ workDate: string; employeeName: string; alreadyListed: boolean }> {
  const locale = params.locale ?? 'tr';
  const qr = await loadActiveQrByToken(admin, params.token);
  if (!qr) {
    throw await diagnoseInactiveQrToken(admin, params.token, params.projectId, locale);
  }

  if (qr.project_id !== params.projectId) {
    throw new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.WRONG_PROJECT, locale);
  }

  if (!qr.session_id) {
    throw new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.SESSION_NOT_ACTIVE, locale);
  }

  const { data: session } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('id', qr.session_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!session) {
    throw await diagnoseInactiveQrToken(admin, params.token, params.projectId, locale);
  }

  const schedule = await loadProjectAttendanceSchedule(admin, params.projectId);
  try {
    assertAttendanceWindowOpen(qr.work_date, schedule);
  } catch {
    throw new AttendanceScanError(ATTENDANCE_MESSAGE_CODES.WINDOW_CLOSED, locale);
  }

  await assertEmployeeTeamHasActiveBlock(admin, params.employeeId, params.projectId);

  const { data: employee } = await admin
    .from('employees')
    .select('name')
    .eq('id', params.employeeId)
    .maybeSingle();

  const employeeName = (employee?.name as string) ?? strings.employeeFallback;

  if (params.replacePrevious) {
    await clearEmployeeAttendanceForDate(admin, {
      employeeId: params.employeeId,
      projectId: params.projectId,
      workDate: qr.work_date,
    });
  }

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
    throw await diagnoseInactiveQrToken(admin, params.token, params.projectId, locale);
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

  await clearAttendanceNotices(admin, {
    employeeId: params.employeeId,
    projectId: params.projectId,
    workDate: qr.work_date,
  });

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
    throw new Error(strings.noActiveSession);
  }

  const schedule = await loadProjectAttendanceSchedule(admin, params.projectId);
  assertAttendanceWindowOpen(workDate, schedule);

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
    throw new Error(strings.noSessionToCancel);
  }

  const now = new Date().toISOString();
  await revokeSessionQrs(admin, session.id);

  const checkIns = await listSessionCheckIns(admin, session.id);
  for (const checkIn of checkIns) {
    await recordAttendanceNotice(admin, {
      employeeId: checkIn.employee_id,
      projectId: params.projectId,
      workDate,
      noticeType: 'session_cancelled',
    });
  }

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
    .select('id, session_id, employee_id, work_log_id, attendance_sessions!inner(project_id, status, work_date)')
    .eq('id', params.checkInId)
    .maybeSingle();

  if (!checkIn) {
    throw new Error(strings.recordNotFound);
  }

  const sessionRaw = checkIn.attendance_sessions as
    | { project_id: string; status: string; work_date: string }
    | { project_id: string; status: string; work_date: string }[];
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;

  if (!session || session.project_id !== params.projectId) {
    throw new Error(strings.recordNotFound);
  }

  if (session.status !== 'active') {
    throw new Error(strings.removeActiveOnly);
  }

  if (checkIn.work_log_id) {
    throw new Error(strings.cannotRemoveWithWorkLog);
  }

  await recordAttendanceNotice(admin, {
    employeeId: checkIn.employee_id as string,
    projectId: params.projectId,
    workDate: session.work_date,
    noticeType: 'removed_from_list',
  });

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
