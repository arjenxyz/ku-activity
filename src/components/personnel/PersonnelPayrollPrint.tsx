'use client';

import { APP_NAME, CREWLEDGER_APP_ICON } from '@/lib/brand';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { contentLocale, type Locale } from '@/lib/i18n/locale';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate, formatDateTime, formatDateWithTime, formatMoney } from '@/lib/format';
import { maskTcKimlik } from '@/lib/field-encryption';
import type { PersonnelEmployee } from '@/lib/personnel-api';
import {
  computeMesaiStats,
  deductionTypeLabel,
  mesaiPayForLog,
  workDayLabel,
  type Deduction,
  type MinimumWage,
  type PersonnelStats,
  type WorkLog,
} from '@/lib/personnel-stats';
import { approvalStatusLabel, getWorkLogApprovalStatus } from '@/lib/work-log';
import { formatString } from '@/lib/strings/format';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type Props = {
  employee: PersonnelEmployee;
  month: string;
  stats: PersonnelStats;
  workLogs: WorkLog[];
  advances: Deduction[];
  otherDeductions: Deduction[];
  minimumWages: MinimumWage[];
};

function monthTitle(month: string, locale: Locale) {
  const content = contentLocale(locale);
  const tag = content === 'en' ? 'en-GB' : content === 'hu' ? 'hu-HU' : 'tr-TR';
  return new Date(`${month}-01T12:00:00`).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
}

function recordAt(row: { created_at?: string | null; admin_confirmed_at?: string | null }) {
  return row.created_at || row.admin_confirmed_at || null;
}

function mesaiLabel(
  type: string | null | undefined,
  strings: ReturnType<typeof getRegistryStrings<'components/personnel/PersonnelPayrollPrint'>>
) {
  if (!type || type === 'none') return strings.emptyValue;
  if (type === 'ceyrek') return strings.mesaiTypes.ceyrek;
  if (type === 'yarim') return strings.mesaiTypes.yarim;
  if (type === 'tam') return strings.mesaiTypes.tam;
  return type;
}

export function PersonnelPayrollPrint({
  employee,
  month,
  stats,
  workLogs,
  advances,
  otherDeductions,
  minimumWages,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelPayrollPrint');
  const { locale } = useLocale();
  const dailyWage = Number(employee.daily_wage);
  const sortedLogs = [...workLogs].sort((a, b) => a.date.localeCompare(b.date));
  const mesaiStats = computeMesaiStats(workLogs, dailyWage);
  const printedAt = formatDateTime(new Date().toISOString());
  const signedDate = formatDate(new Date().toISOString().slice(0, 10));
  const period = monthTitle(month, locale);
  const managerName =
    employee.manager?.name?.trim() ||
    employee.project?.name ||
    employee.project_name ||
    strings.emptyValue;
  const projectLabel = employee.project?.name ?? employee.project_name ?? strings.emptyValue;
  const tcDisplay = employee.tc_kimlik ? maskTcKimlik(employee.tc_kimlik) : null;

  return (
    <div id="personnel-payroll-print" className="print-only personnel-payroll-print">
      <header className="payroll-print-header">
        <div className="payroll-print-brand-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CREWLEDGER_APP_ICON}
            alt=""
            width={48}
            height={48}
            className="payroll-print-logo"
          />
          <div>
            <p className="payroll-print-brand">{APP_NAME}</p>
            <p className="payroll-print-brand-tagline">{strings.footer.brandTagline}</p>
            <h1 className="payroll-print-title">{strings.title}</h1>
            <p className="payroll-print-sub">{period}</p>
          </div>
        </div>
        <div className="payroll-print-meta">
          <p>
            <strong>{strings.printedAt}</strong> {printedAt}
          </p>
          <p>
            <strong>{strings.documentNo}</strong>{' '}
            {employee.id.slice(0, 8).toUpperCase()}-{month.replace('-', '')}
          </p>
          <p>
            <strong>{strings.fields.project}</strong> {projectLabel}
          </p>
        </div>
      </header>

      <section className="payroll-print-section">
        <h2>{strings.employeeInfo}</h2>
        <table className="payroll-print-info">
          <tbody>
            <tr>
              <td>{strings.fields.fullName}</td>
              <td>{employee.name}</td>
              <td>{strings.fields.position}</td>
              <td>{employee.position || strings.emptyValue}</td>
            </tr>
            <tr>
              <td>{strings.fields.project}</td>
              <td>{projectLabel}</td>
              <td>{strings.fields.dailyWage}</td>
              <td>{formatMoney(dailyWage)}</td>
            </tr>
            {tcDisplay ? (
              <tr>
                <td>{strings.fields.tcKimlik}</td>
                <td>{tcDisplay}</td>
                <td>{strings.fields.hireDate}</td>
                <td>{employee.hire_date ? formatDate(employee.hire_date) : strings.emptyValue}</td>
              </tr>
            ) : null}
            {!tcDisplay && employee.hire_date ? (
              <tr>
                <td>{strings.fields.hireDate}</td>
                <td colSpan={3}>{formatDate(employee.hire_date)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="payroll-print-section">
        <h2>{strings.periodSummary}</h2>
        <div className="payroll-print-summary-grid">
          <div>
            <span>{strings.summary.workDays}</span>
            <strong>{stats.workDays}</strong>
          </div>
          <div>
            <span>{strings.summary.approvedDays}</span>
            <strong>{stats.approvedDays}</strong>
          </div>
          <div>
            <span>{strings.summary.pendingDays}</span>
            <strong>{stats.pendingDays}</strong>
          </div>
          <div>
            <span>{strings.summary.mesaiUnits}</span>
            <strong>{stats.mesaiUnits.toFixed(2)}</strong>
          </div>
          <div className="payroll-print-net">
            <span>{strings.summary.netEstimate}</span>
            <strong>{formatMoney(stats.net)}</strong>
          </div>
        </div>
      </section>

      <section className="payroll-print-section">
        <h2>{formatString(strings.workLogsTitle, { count: sortedLogs.length })}</h2>
        {sortedLogs.length === 0 ? (
          <p className="payroll-print-empty">{strings.empty.workLogs}</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.dateTime}</th>
                <th>{strings.table.work}</th>
                <th>{strings.table.mesai}</th>
                <th className="num">{strings.table.wage}</th>
                <th className="num">{strings.table.mesaiPay}</th>
                <th className="num">{strings.table.rowTotal}</th>
                <th>{strings.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => {
                const base = Number(log.amount) * dailyWage;
                const mesai = mesaiPayForLog(log, dailyWage);
                const status = getWorkLogApprovalStatus(log);
                return (
                  <tr key={log.id}>
                    <td>{formatDateWithTime(log.date, recordAt(log))}</td>
                    <td>{workDayLabel(Number(log.amount), log.mesai_type, locale)}</td>
                    <td>{mesaiLabel(String(log.mesai_type ?? ''), strings)}</td>
                    <td className="num">{formatMoney(base)}</td>
                    <td className="num">{mesai > 0 ? formatMoney(mesai) : strings.emptyValue}</td>
                    <td className="num">{formatMoney(base + mesai)}</td>
                    <td>{approvalStatusLabel(status, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>{strings.table.total}</strong>
                </td>
                <td className="num">{formatMoney(stats.basePay)}</td>
                <td className="num">{formatMoney(stats.mesaiPay)}</td>
                <td className="num">{formatMoney(stats.gross)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {mesaiStats.recordCount > 0 ? (
        <section className="payroll-print-section">
          <h2>{strings.mesaiSummary}</h2>
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.type}</th>
                <th className="num">{strings.table.record}</th>
                <th className="num">{strings.table.unit}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{strings.mesaiTypes.ceyrek}</td>
                <td className="num">{mesaiStats.byType.ceyrek.count}</td>
                <td className="num">{mesaiStats.byType.ceyrek.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.ceyrek.pay)}</td>
              </tr>
              <tr>
                <td>{strings.mesaiTypes.yarim}</td>
                <td className="num">{mesaiStats.byType.yarim.count}</td>
                <td className="num">{mesaiStats.byType.yarim.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.yarim.pay)}</td>
              </tr>
              <tr>
                <td>{strings.mesaiTypes.tam}</td>
                <td className="num">{mesaiStats.byType.tam.count}</td>
                <td className="num">{mesaiStats.byType.tam.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.tam.pay)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <strong>{strings.totals.grand}</strong>
                </td>
                <td className="num">{mesaiStats.recordCount}</td>
                <td className="num">{mesaiStats.totalUnits.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.totalPay)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : null}

      <section className="payroll-print-section">
        <h2>{formatString(strings.advancesTitle, { count: advances.length })}</h2>
        {advances.length === 0 ? (
          <p className="payroll-print-empty">{strings.empty.advances}</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.dateTime}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateWithTime(r.date, r.created_at)}</td>
                  <td>{r.description || strings.defaults.advance}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>{strings.totals.advances}</strong>
                </td>
                <td className="num">{formatMoney(stats.totalAdvance)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section">
        <h2>{formatString(strings.deductionsTitle, { count: otherDeductions.length })}</h2>
        {otherDeductions.length === 0 ? (
          <p className="payroll-print-empty">{strings.empty.deductions}</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.dateTime}</th>
                <th>{strings.table.deductionType}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {otherDeductions.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateWithTime(r.date, r.created_at)}</td>
                  <td>{deductionTypeLabel(r.type, locale)}</td>
                  <td>{r.description || strings.emptyValue}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>{strings.totals.deductions}</strong>
                </td>
                <td className="num">{formatMoney(stats.totalDeduct)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section">
        <h2>{formatString(strings.minimumWagesTitle, { count: minimumWages.length })}</h2>
        {minimumWages.length === 0 ? (
          <p className="payroll-print-empty">{strings.empty.minimumWages}</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.dateTime}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {minimumWages.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateWithTime(r.date, r.created_at)}</td>
                  <td>{r.description || strings.defaults.minimumWage}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>{strings.totals.minimumWages}</strong>
                </td>
                <td className="num">{formatMoney(stats.totalMinimum)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section payroll-print-calc">
        <h2>{strings.calcSummary}</h2>
        <table className="payroll-print-calc-table">
          <tbody>
            <tr>
              <td>
                {formatString(strings.calc.basePay, {
                  days: stats.workDays,
                  wage: formatMoney(dailyWage),
                })}
              </td>
              <td className="num">{formatMoney(stats.basePay)}</td>
            </tr>
            {stats.mesaiPay > 0 ? (
              <tr>
                <td>{strings.calc.mesaiPay}</td>
                <td className="num">{formatMoney(stats.mesaiPay)}</td>
              </tr>
            ) : null}
            <tr className="subtotal">
              <td>
                <strong>{strings.calc.gross}</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(stats.gross)}</strong>
              </td>
            </tr>
            <tr>
              <td>{strings.calc.advances}</td>
              <td className="num">− {formatMoney(stats.totalAdvance)}</td>
            </tr>
            <tr>
              <td>{strings.calc.deductions}</td>
              <td className="num">− {formatMoney(stats.totalDeduct)}</td>
            </tr>
            {stats.totalMinimum > 0 ? (
              <tr>
                <td>{strings.calc.minimumWages}</td>
                <td className="num">− {formatMoney(stats.totalMinimum)}</td>
              </tr>
            ) : null}
            <tr className="total">
              <td>
                <strong>{strings.calc.netPayment}</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(stats.net)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="payroll-print-note">
          {formatString(strings.calc.note, {
            gross: formatMoney(stats.gross),
            advances: formatMoney(stats.totalAdvance),
            deductions: formatMoney(stats.totalDeduct),
            minimumPart:
              stats.totalMinimum > 0
                ? formatString(strings.calc.minimumPart, { amount: formatMoney(stats.totalMinimum) })
                : '',
            net: formatMoney(stats.net),
          })}
        </p>
      </section>

      <footer className="payroll-print-footer">
        <div className="payroll-print-sign-row">
          <div className="payroll-print-sign-card">
            <span className="payroll-print-sign-label">{strings.footer.employee}</span>
            <span className="payroll-print-sign-role">{strings.footer.employeeRole}</span>
            <div className="payroll-print-sign-pad" aria-hidden />
            <div className="payroll-print-sign-line" />
            <strong className="payroll-print-sign-name">{employee.name}</strong>
            <small>
              {strings.footer.signedAt}: {signedDate}
            </small>
          </div>

          <div className="payroll-print-sign-card">
            <span className="payroll-print-sign-label">{strings.footer.employer}</span>
            <span className="payroll-print-sign-role">{strings.footer.employerRole}</span>
            <div className="payroll-print-sign-pad" aria-hidden />
            <div className="payroll-print-sign-line" />
            <strong className="payroll-print-sign-name">{managerName}</strong>
            <small>
              {strings.footer.signedAt}: {signedDate}
            </small>
          </div>
        </div>

        <div className="payroll-print-clauses">
          <p className="payroll-print-clauses-title">{strings.footer.clausesTitle}</p>
          <ol className="payroll-print-clauses-list">
            {strings.footer.clauses.map((clause, index) => (
              <li key={index}>{formatString(clause, { appName: APP_NAME })}</li>
            ))}
          </ol>
        </div>

        <div className="payroll-print-seal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dijital-onay.png"
            alt={strings.footer.digitalSeal}
            className="payroll-print-seal-img"
          />
          <p className="payroll-print-seal-title">{strings.footer.digitalSeal}</p>
          <p className="payroll-print-seal-hint">{strings.footer.digitalSealHint}</p>
        </div>
      </footer>
    </div>
  );
}
