import type { SupabaseClient } from '@supabase/supabase-js';
import { mesaiTypeToUnits, type MesaiType } from '@/lib/work-log';

export type WorkLogRow = {
  id: string;
  employee_id: string;
  project_id: string;
  date: string;
  amount: number;
  mesai_type: MesaiType;
  mesai_units: number;
  description: string | null;
  approved: boolean;
  admin_confirmed_at: string | null;
  employee_confirmed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
};

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

export async function adminConfirmWorkLog(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    date: string;
    amount: number;
    mesaiType: MesaiType;
    description?: string | null;
    approvedBy?: string | null;
  }
): Promise<WorkLogRow> {
  const existing = await findWorkLog(admin, params.employeeId, params.date);
  const now = new Date().toISOString();
  const mesai_units = mesaiTypeToUnits(params.mesaiType);

  const payload = {
    project_id: params.projectId,
    employee_id: params.employeeId,
    date: params.date,
    amount: params.amount,
    mesai_type: params.mesaiType,
    mesai_units,
    description: params.description ?? null,
    admin_confirmed_at: now,
    approved_by: params.approvedBy ?? null,
    approved: false,
    employee_confirmed_at: null,
    employee_dispute_note: null,
    employee_disputed_at: null,
  };

  if (existing) {
    const { data, error } = await admin
      .from('work_logs')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data as WorkLogRow;
  }

  const { data, error } = await admin
    .from('work_logs')
    .insert({
      ...payload,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu tarih için zaten yevmiye kaydı var');
    }
    throw new Error(error.message);
  }
  return data as WorkLogRow;
}

export async function employeeConfirmWorkLog(
  admin: SupabaseClient,
  params: {
    projectId: string;
    employeeId: string;
    date: string;
    amount?: number;
  }
): Promise<WorkLogRow> {
  const existing = await findWorkLog(admin, params.employeeId, params.date);
  const now = new Date().toISOString();
  const amount = params.amount ?? 1;

  if (existing) {
    if (existing.employee_confirmed_at) {
      throw new Error('Bu gün için zaten onay verdiniz');
    }
    const { data, error } = await admin
      .from('work_logs')
      .update({
        employee_confirmed_at: now,
        amount: existing.admin_confirmed_at ? existing.amount : amount,
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
      date: params.date,
      amount,
      mesai_type: 'none',
      mesai_units: 0,
      employee_confirmed_at: now,
      admin_confirmed_at: null,
      approved: false,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu tarih için zaten kayıt var');
    }
    throw new Error(error.message);
  }
  return data as WorkLogRow;
}

export async function employeeDisputeWorkLog(
  admin: SupabaseClient,
  params: {
    recordId: string;
    employeeId: string;
    note: string;
  }
): Promise<WorkLogRow> {
  const note = params.note.trim();
  if (note.length < 5) {
    throw new Error('İtiraz notu en az 5 karakter olmalı');
  }

  const { data: existing, error: loadError } = await admin
    .from('work_logs')
    .select('*')
    .eq('id', params.recordId)
    .eq('employee_id', params.employeeId)
    .maybeSingle();

  if (loadError || !existing) {
    throw new Error('Yevmiye kaydı bulunamadı');
  }

  if (existing.approved) {
    throw new Error('Onaylanmış kayda itiraz edilemez');
  }

  if (existing.employee_confirmed_at) {
    throw new Error('Zaten onayladığınız kayda itiraz edilemez');
  }

  const { data, error } = await admin
    .from('work_logs')
    .update({
      employee_dispute_note: note,
      employee_disputed_at: new Date().toISOString(),
    })
    .eq('id', params.recordId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as WorkLogRow;
}
