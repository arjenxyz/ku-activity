import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import {
  computeMinimumWageGapWithPolicy,
  getReferenceMinimumAmount,
  mergeWagePolicies,
} from '@/lib/wage-policy-calc';
import { computeGrossPay, type WorkLog } from '@/lib/personnel-stats';
import { DEFAULT_WAGE_POLICY, normalizeWagePolicy } from '@/types/wage-policy';

export async function GET(request: Request) {
  try {
    const session = await requirePersonnelSession();
    const month = new URL(request.url).searchParams.get('month');
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Geçerli ay gerekli (YYYY-MM)' }, { status: 400 });
    }

    const admin = createAdminClient();
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const end = new Date(y, m, 0).toISOString().slice(0, 10);

    const { data: employee, error: empErr } = await admin
      .from('employees')
      .select('id, hire_date, daily_wage, project_id')
      .eq('id', session.employeeId)
      .maybeSingle();

    if (empErr || !employee) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 });
    }

    const { data: project } = await admin
      .from('projects')
      .select('created_by')
      .eq('id', employee.project_id)
      .maybeSingle();

    const ownerId = project?.created_by as string | null;

    let companyPolicy = null;
    let projectRow = null;

    if (ownerId) {
      const { data: companyRow } = await admin
        .from('wage_policies')
        .select('policy')
        .eq('owner_id', ownerId)
        .is('project_id', null)
        .maybeSingle();
      if (companyRow?.policy) companyPolicy = normalizeWagePolicy(companyRow.policy);

      const { data: projRow } = await admin
        .from('wage_policies')
        .select('policy, use_company_default')
        .eq('owner_id', ownerId)
        .eq('project_id', employee.project_id)
        .maybeSingle();
      if (projRow) {
        projectRow = {
          policy: projRow.policy ? normalizeWagePolicy(projRow.policy) : null,
          useCompanyDefault: projRow.use_company_default !== false,
        };
      }
    }

    const resolved = mergeWagePolicies(companyPolicy, projectRow);
    const policyConfigured = Boolean(companyPolicy?.configuredAt || projectRow?.policy?.configuredAt);

    const { data: workLogsRaw } = await admin
      .from('work_logs')
      .select('id, date, amount, mesai_type, mesai_units, approved')
      .eq('employee_id', session.employeeId)
      .gte('date', start)
      .lte('date', end);

    const approvedLogs = (workLogsRaw ?? []).filter((l) => l.approved === true) as WorkLog[];
    const { gross: approvedGross, workDays: approvedDays } = computeGrossPay(
      approvedLogs,
      Number(employee.daily_wage),
      { approvedOnly: true }
    );

    const { data: minRows, error: minErr } = await admin
      .from('minimum_wages')
      .select('id, date, amount, description')
      .eq('employee_id', session.employeeId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (minErr?.message?.includes('minimum_wages')) {
      return NextResponse.json({
        month,
        policyConfigured: false,
        note: '004_menu_features.sql çalıştırın',
        records: [],
      });
    }

    const minimumPaid = (minRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const policy = policyConfigured ? resolved : DEFAULT_WAGE_POLICY;

    const gap = computeMinimumWageGapWithPolicy({
      month,
      hireDate: employee.hire_date,
      grossEarned: approvedGross,
      minimumPaid,
      workedDays: approvedDays,
      policy,
    });

    const referenceMonthly = getReferenceMinimumAmount(policy);

    let paymentStatus: 'complete' | 'partial' | 'open' | 'none' = 'none';
    if (gap.eligibleMinimum > 0) {
      if (!gap.isBelowMinimum || gap.remainingGap <= 0) paymentStatus = 'complete';
      else if (minimumPaid > 0) paymentStatus = 'partial';
      else paymentStatus = 'open';
    }

    return NextResponse.json({
      month,
      hireDate: employee.hire_date,
      policyConfigured,
      policy: {
        yevmiyePaymentTriggers: policy.yevmiyePaymentTriggers,
        yevmiyePaymentNotes: policy.yevmiyePaymentNotes,
        prorationFromHireDate: policy.prorationFromHireDate,
        prorationMode: policy.prorationMode,
        referenceMonthly,
      },
      earnings: {
        approvedGross,
        approvedDays,
        minimumPaid,
      },
      gap: {
        eligibleMinimum: gap.eligibleMinimum,
        remainingGap: gap.remainingGap,
        isBelowMinimum: gap.isBelowMinimum,
        paymentStatus,
      },
      records: minRows ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Oturum geçersiz' }, { status: 401 });
  }
}
