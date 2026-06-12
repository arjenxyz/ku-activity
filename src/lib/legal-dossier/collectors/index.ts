import { decryptField } from '@/lib/field-encryption';
import { applyContractPlaceholders } from '@/lib/contract-templates';
import { getCompanyInfo } from '@/lib/company-config';
import { approvalStatusLabel, formatWorkLogSummary, getWorkLogApprovalStatus } from '@/lib/work-log';
import { registerDossierCollector } from '../registry';
import { jsonFile, toCsv } from '../utils';
import type { DossierFile } from '../types';

function formatTime(t: string | null | undefined) {
  return t ? String(t).slice(0, 5) : '';
}

registerDossierCollector({
  id: 'profile',
  title: 'Personel profili',
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

    if (error || !emp) throw new Error('Personel bulunamadı');

    return [jsonFile('01-profil/personel.json', emp)];
  },
});

registerDossierCollector({
  id: 'sensitive',
  title: 'Hassas kimlik ve banka bilgileri',
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
          note: 'Hassas veri kaydı bulunamadı veya şifreleme yapılandırılmamış',
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
  title: 'Proje ve çalışma yeri',
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
  title: 'Yevmiye ve puantaj kayıtları',
  order: 40,
  async collect(ctx) {
    const { data: logs } = await ctx.admin
      .from('work_logs')
      .select(
        'id, date, amount, mesai_type, mesai_units, description, hours_worked, approved, admin_confirmed_at, employee_confirmed_at, created_at'
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
  title: 'Avans ve kesintiler',
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
  id: 'minimum_wages',
  title: 'Asgari ücret kayıtları',
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
  title: 'Bordro dönemleri ve satırlar',
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
  title: 'Sözleşme onayları ve metinleri',
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
<p><strong>Onay:</strong> ${row.accepted_at}</p>
<p><strong>Sürüm:</strong> ${row.contract_version}</p>
${row.content_hash ? `<p><strong>İçerik hash:</strong> <code>${row.content_hash}</code></p>` : ''}
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
  title: 'Başvuru ve onay geçmişi',
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
  id: 'company',
  title: 'İşletme / veri sorumlusu bilgisi',
  order: 5,
  async collect() {
    return [jsonFile('00-meta/isletme.json', getCompanyInfo())];
  },
});

/** Gelecek modüller için yer tutucu — örnek: izin talepleri, belgeler, disiplin */
registerDossierCollector({
  id: 'extensions_placeholder',
  title: 'Genişletilebilir modül alanı',
  order: 999,
  async collect() {
    return [
      jsonFile('99-gelecek/README.json', {
        message:
          'CrewLedger hukuki dosya sistemi genişletilebilir. Yeni özellikler registerDossierCollector() ile eklenir.',
        reservedModules: [
          'leave_requests — İzin / devamsızlık talepleri',
          'documents — Yüklenen belgeler',
          'disciplinary — Disiplin kayıtları',
          'communications — Bildirim ve mesaj logları',
          'attendance_devices — Cihaz bazlı yoklama',
        ],
        integration:
          'src/lib/legal-dossier/collectors/ altına yeni dosya ekleyip registerDossierCollector çağırın.',
      }),
    ];
  },
});
