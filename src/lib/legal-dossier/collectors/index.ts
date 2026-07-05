import { decryptField } from '@/lib/field-encryption';
import { applyContractPlaceholders } from '@/lib/contract-templates';
import { getCompanyInfo } from '@/lib/company-config';
import { approvalStatusLabel, formatWorkLogSummary, getWorkLogApprovalStatus } from '@/lib/work-log';
import strings from '@json/src/lib/legal-dossier/collectors/index.json';
import { registerDossierCollector } from '../registry';
import { jsonFile, toCsv } from '../utils';
import {
  LEGAL_DOSSIER_SCHEMA_VERSION,
  PROJECT_CLOSURE_CONSENT_VERSION,
  type DossierFile,
} from '../types';

function formatTime(t: string | null | undefined) {
  return t ? String(t).slice(0, 5) : '';
}

registerDossierCollector({
  id: 'profile',
  title: strings.collectors.profile.title,
  order: 10,
  async collect(ctx) {
    const { data: emp, error } = await ctx.admin
      .from('employees')
      .select(
        'id, name, email, phone, position, daily_wage, hire_date, is_active, photo_url, created_at, updated_at'
      )
      .eq('id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .maybeSingle();

    if (error || !emp) throw new Error(strings.errors.employeeNotFound);

    return [jsonFile('01-profil/personel.json', emp)];
  },
});

registerDossierCollector({
  id: 'sensitive',
  title: strings.collectors.sensitive.title,
  order: 20,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('employee_sensitive_data')
      .select('tc_kimlik_enc, birth_date_enc, iban_enc, created_at, updated_at')
      .eq('employee_id', ctx.employeeId)
      .maybeSingle();

    if (!data || !process.env.FIELD_ENCRYPTION_KEY) {
      return [
        jsonFile('02-hassas/veriler.json', {
          note: strings.collectors.sensitive.noDataNote,
        }),
      ];
    }

    const payload = {
      tcKimlik: decryptField(data.tc_kimlik_enc),
      birthDate: decryptField(data.birth_date_enc),
      iban: decryptField(data.iban_enc),
      recordedAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return [jsonFile('02-hassas/veriler.json', payload)];
  },
});

registerDossierCollector({
  id: 'project',
  title: strings.collectors.project.title,
  order: 30,
  async collect(ctx) {
    const { data: project } = await ctx.admin
      .from('projects')
      .select(
        'id, name, code, status, description, location, start_date, end_date, work_start_time, work_end_time, created_at'
      )
      .eq('id', ctx.projectId)
      .maybeSingle();

    const enriched = project
      ? {
          ...project,
          work_hours:
            project.work_start_time || project.work_end_time
              ? `${formatTime(project.work_start_time)} – ${formatTime(project.work_end_time)}`
              : null,
        }
      : null;

    return [jsonFile('03-proje/proje.json', enriched)];
  },
});

registerDossierCollector({
  id: 'work_logs',
  title: strings.collectors.workLogs.title,
  order: 40,
  async collect(ctx) {
    const { data: logs } = await ctx.admin
      .from('work_logs')
      .select(
        'id, date, amount, mesai_type, mesai_units, description, hours_worked, approved, admin_confirmed_at, employee_confirmed_at, employee_dispute_note, employee_disputed_at, created_at'
      )
      .eq('employee_id', ctx.employeeId)
      .order('date', { ascending: false });

    const rows = (logs ?? []).map((l) => {
      const status = getWorkLogApprovalStatus(l);
      return {
        ...l,
        approval_status: status,
        approval_label: approvalStatusLabel(status),
        summary: formatWorkLogSummary(Number(l.amount), l.mesai_type),
      };
    });

    const csv = toCsv(
      [
        'date',
        'amount',
        'mesai_type',
        'mesai_units',
        'summary',
        'approval_status',
        'approved',
        'admin_confirmed_at',
        'employee_confirmed_at',
        'employee_dispute_note',
        'employee_disputed_at',
        'description',
      ],
      rows.map((r) => [
        r.date,
        r.amount,
        r.mesai_type,
        r.mesai_units,
        r.summary,
        r.approval_status,
        r.approved,
        r.admin_confirmed_at,
        r.employee_confirmed_at,
        r.employee_dispute_note,
        r.employee_disputed_at,
        r.description,
      ])
    );

    return [
      jsonFile('04-yevmiye/kayitlar.json', rows),
      { path: '04-yevmiye/kayitlar.csv', content: csv },
    ];
  },
});

registerDossierCollector({
  id: 'deductions',
  title: strings.collectors.deductions.title,
  order: 50,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('deductions')
      .select('id, date, type, amount, description, created_at')
      .eq('employee_id', ctx.employeeId)
      .order('date', { ascending: false });

    const rows = data ?? [];
    const csv = toCsv(
      ['date', 'type', 'amount', 'description', 'created_at'],
      rows.map((r) => [r.date, r.type, r.amount, r.description, r.created_at])
    );

    return [
      jsonFile('05-avans-kesinti/kayitlar.json', rows),
      { path: '05-avans-kesinti/kayitlar.csv', content: csv },
    ];
  },
});

registerDossierCollector({
  id: 'advance_requests',
  title: strings.collectors.advanceRequests.title,
  order: 52,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('advance_requests')
      .select(
        `
        id,
        requested_amount,
        approved_amount,
        employee_note,
        admin_note,
        status,
        payment_method,
        requested_at,
        approved_at,
        paid_at,
        rejected_at,
        cancelled_at,
        rejection_reason,
        proof_storage_backend,
        proof_external_id,
        proof_file_name,
        proof_mime_type,
        proof_reference_no,
        proof_ocr_json,
        deduction_id,
        created_at,
        updated_at
      `
      )
      .eq('employee_id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .order('requested_at', { ascending: false });

    const rows = data ?? [];
    const csv = toCsv(
      [
        'requested_at',
        'status',
        'requested_amount',
        'approved_amount',
        'payment_method',
        'paid_at',
        'proof_reference_no',
        'deduction_id',
      ],
      rows.map((r) => [
        r.requested_at,
        r.status,
        r.requested_amount,
        r.approved_amount,
        r.payment_method,
        r.paid_at,
        r.proof_reference_no,
        r.deduction_id,
      ])
    );

    return [
      jsonFile('10-avans-talepleri/README.json', {
        note: strings.collectors.advanceRequests.proofNote,
        includedFields: [
          'proof_storage_backend',
          'proof_external_id',
          'proof_file_name',
          'proof_mime_type',
          'proof_reference_no',
          'proof_ocr_json',
        ],
        excluded: 'Ham dekont dosyası ZIP içine kopyalanmaz; yalnızca metadata arşivlenir.',
      }),
      jsonFile('10-avans-talepleri/kayitlar.json', rows),
      { path: '10-avans-talepleri/kayitlar.csv', content: csv },
    ];
  },
});

registerDossierCollector({
  id: 'minimum_wages',
  title: strings.collectors.minimumWages.title,
  order: 60,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('minimum_wages')
      .select('id, date, amount, description, created_at')
      .eq('employee_id', ctx.employeeId)
      .order('date', { ascending: false });

    const rows = data ?? [];
    const csv = toCsv(
      ['date', 'amount', 'description', 'created_at'],
      rows.map((r) => [r.date, r.amount, r.description, r.created_at])
    );

    return [
      jsonFile('06-asgari/kayitlar.json', rows),
      { path: '06-asgari/kayitlar.csv', content: csv },
    ];
  },
});

registerDossierCollector({
  id: 'payroll',
  title: strings.collectors.payroll.title,
  order: 70,
  async collect(ctx) {
    const { data: lines } = await ctx.admin
      .from('payroll_lines')
      .select(
        `
        id,
        work_days,
        gross_pay,
        advances,
        other_deductions,
        minimum_paid,
        net_pay,
        payroll_periods (
          period_month,
          title,
          status,
          project_id
        )
      `
      )
      .eq('employee_id', ctx.employeeId);

    const filtered = (lines ?? []).filter((line) => {
      const period = Array.isArray(line.payroll_periods)
        ? line.payroll_periods[0]
        : line.payroll_periods;
      return period && (period as { project_id?: string }).project_id === ctx.projectId;
    });

    return [jsonFile('07-bordro/donemler.json', filtered)];
  },
});

registerDossierCollector({
  id: 'contracts',
  title: strings.collectors.contracts.title,
  order: 80,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('personnel_contract_acceptances')
      .select(
        `
        access_token,
        contract_version,
        content_hash,
        accepted_at,
        scroll_completed_at,
        user_agent,
        email,
        full_name,
        personnel_contracts (slug, title, summary, content_html, version)
      `
      )
      .eq('employee_id', ctx.employeeId)
      .order('accepted_at', { ascending: true });

    const files: DossierFile[] = [];
    const index: Array<Record<string, unknown>> = [];

    for (const row of data ?? []) {
      const contract = Array.isArray(row.personnel_contracts)
        ? row.personnel_contracts[0]
        : row.personnel_contracts;
      if (!contract) continue;

      const slug = contract.slug as string;
      const html = applyContractPlaceholders(contract.content_html as string);
      const meta = {
        slug,
        title: contract.title,
        summary: contract.summary,
        version: row.contract_version,
        contentHash: row.content_hash,
        acceptedAt: row.accepted_at,
        scrollCompletedAt: row.scroll_completed_at,
        userAgent: row.user_agent,
        email: row.email,
        fullName: row.full_name,
        publicViewPath: `/sozlesme/${slug}?t=${row.access_token}`,
      };
      index.push(meta);

      const contractHtml = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>${contract.title}</title>
<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}
.contract-meta{background:#f8fafc;border:1px solid #e2e8f0;padding:1rem;border-radius:8px;margin-bottom:1rem;font-size:0.85rem}
</style></head><body>
<div class="contract-meta">
<p><strong>${strings.contractHtml.approvedLabel}</strong> ${row.accepted_at}</p>
<p><strong>${strings.contractHtml.versionLabel}</strong> ${row.contract_version}</p>
${row.content_hash ? `<p><strong>${strings.contractHtml.contentHashLabel}</strong> <code>${row.content_hash}</code></p>` : ''}
</div>
${html}
</body></html>`;

      files.push({
        path: `08-sozlesmeler/${slug}-v${row.contract_version}.html`,
        content: contractHtml,
      });
    }

    files.unshift(jsonFile('08-sozlesmeler/onay-index.json', index));
    return files;
  },
});

registerDossierCollector({
  id: 'registration',
  title: strings.collectors.registration.title,
  order: 90,
  async collect(ctx) {
    const { data: emp } = await ctx.admin
      .from('employees')
      .select('email, created_at')
      .eq('id', ctx.employeeId)
      .maybeSingle();

    const email = emp?.email?.toLowerCase();

    const { data: byEmployee } = await ctx.admin
      .from('employee_registration_requests')
      .select(
        'id, status, first_name, last_name, email, phone, position, verification_code, created_at, reviewed_at, expires_at, photo_path, employee_id'
      )
      .eq('employee_id', ctx.employeeId)
      .order('created_at', { ascending: false })
      .limit(5);

    let byEmail: typeof byEmployee = [];
    if (email) {
      const { data } = await ctx.admin
        .from('employee_registration_requests')
        .select(
          'id, status, first_name, last_name, email, phone, position, verification_code, created_at, reviewed_at, expires_at, photo_path, employee_id'
        )
        .ilike('email', email)
        .order('created_at', { ascending: false })
        .limit(5);
      byEmail = data ?? [];
    }

    const merged = [...(byEmployee ?? []), ...byEmail].filter(
      (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx
    );

    return [
      jsonFile('09-basvuru/kayitlar.json', {
        employeeCreatedAt: emp?.created_at ?? null,
        registrations: merged,
      }),
    ];
  },
});

registerDossierCollector({
  id: 'attendance',
  title: strings.collectors.attendance.title,
  order: 91,
  async collect(ctx) {
    const { data: sessions } = await ctx.admin
      .from('attendance_sessions')
      .select('id, work_date, status, started_at, completed_at')
      .eq('project_id', ctx.projectId)
      .order('work_date', { ascending: false });

    const sessionMap = new Map(
      (sessions ?? []).map((s) => [s.id as string, s])
    );
    const sessionIds = [...sessionMap.keys()];

    let checkins: Array<{
      id: string;
      scanned_at: string;
      work_log_id: string | null;
      session_id: string;
    }> = [];

    if (sessionIds.length > 0) {
      const { data } = await ctx.admin
        .from('attendance_session_checkins')
        .select('id, scanned_at, work_log_id, session_id')
        .eq('employee_id', ctx.employeeId)
        .in('session_id', sessionIds)
        .order('scanned_at', { ascending: false });
      checkins = data ?? [];
    }

    const sessionRows = checkins.map((row) => {
      const session = sessionMap.get(row.session_id);
      return {
        checkin_id: row.id,
        scanned_at: row.scanned_at,
        work_log_id: row.work_log_id,
        session_id: row.session_id,
        work_date: session?.work_date ?? null,
        session_status: session?.status ?? null,
        session_started_at: session?.started_at ?? null,
        session_completed_at: session?.completed_at ?? null,
      };
    });

    const { data: notices } = await ctx.admin
      .from('attendance_employee_notices')
      .select('id, work_date, notice_type, created_at')
      .eq('employee_id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .order('created_at', { ascending: false });

    const checkinCsv = toCsv(
      ['work_date', 'scanned_at', 'session_status', 'work_log_id'],
      sessionRows.map((r) => [r.work_date, r.scanned_at, r.session_status, r.work_log_id])
    );

    return [
      jsonFile('11-yoklama/checkin-kayitlari.json', sessionRows),
      { path: '11-yoklama/checkin-kayitlari.csv', content: checkinCsv },
      jsonFile('11-yoklama/oturum-bildirimleri.json', notices ?? []),
    ];
  },
});

registerDossierCollector({
  id: 'notifications',
  title: strings.collectors.notifications.title,
  order: 92,
  async collect(ctx) {
    const { data } = await ctx.admin
      .from('personnel_notifications')
      .select('id, type, title, body, href, data, read_at, push_sent_at, created_at')
      .eq('employee_id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .order('created_at', { ascending: false });

    const rows = data ?? [];
    const csv = toCsv(
      ['created_at', 'type', 'title', 'body', 'read_at'],
      rows.map((r) => [r.created_at, r.type, r.title, r.body, r.read_at])
    );

    return [
      jsonFile('12-bildirimler/kayitlar.json', rows),
      { path: '12-bildirimler/kayitlar.csv', content: csv },
    ];
  },
});

registerDossierCollector({
  id: 'closure_consent',
  title: strings.collectors.closureConsent.title,
  order: 15,
  async collect(ctx) {
    const { data: project } = await ctx.admin
      .from('projects')
      .select(
        'closure_phase, closure_started_at, closure_deadline_at, closure_fast_path_deadline_at'
      )
      .eq('id', ctx.projectId)
      .maybeSingle();

    const { data: consent } = await ctx.admin
      .from('project_closure_consents')
      .select(
        'consent_version, consented_at, data_exported_at, data_export_acknowledged_at, user_agent'
      )
      .eq('project_id', ctx.projectId)
      .eq('employee_id', ctx.employeeId)
      .maybeSingle();

    const { data: lastExport } = await ctx.admin
      .from('legal_dossier_exports')
      .select('created_at, export_type, schema_version')
      .eq('employee_id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .in('export_type', ['personnel_self', 'admin'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: exportHistory } = await ctx.admin
      .from('legal_dossier_exports')
      .select('created_at, export_type, schema_version, exported_by_email')
      .eq('employee_id', ctx.employeeId)
      .eq('project_id', ctx.projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    const inClosure =
      project?.closure_phase && project.closure_phase !== 'none' && project.closure_phase !== 'purged';

    const payload = {
      schemaVersion: LEGAL_DOSSIER_SCHEMA_VERSION,
      currentConsentVersion: PROJECT_CLOSURE_CONSENT_VERSION,
      projectClosure: inClosure
        ? {
            phase: project?.closure_phase,
            startedAt: project?.closure_started_at,
            deadlineAt: project?.closure_deadline_at,
            fastPathDeadlineAt: project?.closure_fast_path_deadline_at,
          }
        : null,
      consent: consent
        ? {
            version: consent.consent_version,
            consentedAt: consent.consented_at,
            dataExportedAt: consent.data_exported_at,
            dataExportAcknowledgedAt: consent.data_export_acknowledged_at,
            dataDownloadAcknowledged: Boolean(consent.data_export_acknowledged_at),
            userAgent: consent.user_agent,
          }
        : null,
      dossierExportHistory: exportHistory ?? [],
      lastDossierDownload: lastExport
        ? {
            at: lastExport.created_at,
            exportType: lastExport.export_type,
            schemaVersion: lastExport.schema_version,
          }
        : null,
      note: inClosure || consent ? null : strings.collectors.closureConsent.notInClosure,
    };

    return [jsonFile('00-meta/kapanis-onayi.json', payload)];
  },
});

registerDossierCollector({
  id: 'company',
  title: strings.collectors.company.title,
  order: 5,
  async collect() {
    return [jsonFile('00-meta/isletme.json', getCompanyInfo())];
  },
});

/** Gelecek modüller için yer tutucu — örnek: izin talepleri, belgeler, disiplin */
registerDossierCollector({
  id: 'extensions_placeholder',
  title: strings.collectors.extensionsPlaceholder.title,
  order: 999,
  async collect() {
    return [
      jsonFile('99-gelecek/README.json', {
        message: strings.extensionsPlaceholder.message,
        reservedModules: strings.extensionsPlaceholder.reservedModules,
        integration: strings.extensionsPlaceholder.integration,
      }),
    ];
  },
});
