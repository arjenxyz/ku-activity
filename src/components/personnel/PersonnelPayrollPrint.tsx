'use client';

import { APP_NAME } from '@/lib/brand';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
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

function monthTitle(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
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
  const dailyWage = Number(employee.daily_wage);
  const sortedLogs = [...workLogs].sort((a, b) => a.date.localeCompare(b.date));
  const mesaiStats = computeMesaiStats(workLogs, dailyWage);
  const printedAt = formatDateTime(new Date().toISOString());
  const period = monthTitle(month);

  const tcDisplay = employee.tc_kimlik
    ? maskTcKimlik(employee.tc_kimlik)
    : null;

  return (
    <div id="personnel-payroll-print" className="print-only personnel-payroll-print">
      <header className="payroll-print-header">
        <div>
          <p className="payroll-print-brand">{APP_NAME}</p>
          <h1 className="payroll-print-title">{strings.title}</h1>
          <p className="payroll-print-sub">{period}</p>
        </div>
        <div className="payroll-print-meta">
          <p>
            <strong>{strings.printedAt}</strong> {printedAt}
          </p>
          <p>
            <strong>{strings.documentNo}</strong> {employee.id.slice(0, 8).toUpperCase()}-{month.replace('-', '')}
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
              <td>{employee.project?.name ?? employee.project_name ?? strings.emptyValue}</td>
              <td>{strings.fields.dailyWage}</td>
              <td>{formatMoney(dailyWage)}</td>
            </tr>
            {tcDisplay && (
              <tr>
                <td>{strings.fields.tcKimlik}</td>
                <td>{tcDisplay}</td>
                <td>{strings.fields.hireDate}</td>
                <td>{employee.hire_date ? formatDate(employee.hire_date) : strings.emptyValue}</td>
              </tr>
            )}
            {!tcDisplay && employee.hire_date && (
              <tr>
                <td>{strings.fields.hireDate}</td>
                <td colSpan={3}>{formatDate(employee.hire_date)}</td>
              </tr>
            )}
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
                <th>{strings.table.date}</th>
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
                    <td>{formatDate(log.date)}</td>
                    <td>{workDayLabel(Number(log.amount), log.mesai_type)}</td>
                    <td>{mesaiLabel(String(log.mesai_type ?? ''), strings)}</td>
                    <td className="num">{formatMoney(base)}</td>
                    <td className="num">{mesai > 0 ? formatMoney(mesai) : strings.emptyValue}</td>
                    <td className="num">{formatMoney(base + mesai)}</td>
                    <td>{approvalStatusLabel(status)}</td>
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

      {mesaiStats.recordCount > 0 && (
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
      )}

      <section className="payroll-print-section">
        <h2>{formatString(strings.advancesTitle, { count: advances.length })}</h2>
        {advances.length === 0 ? (
          <p className="payroll-print-empty">{strings.empty.advances}</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>{strings.table.date}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
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
                <th>{strings.table.date}</th>
                <th>{strings.table.deductionType}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {otherDeductions.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{deductionTypeLabel(r.type)}</td>
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
                <th>{strings.table.date}</th>
                <th>{strings.table.description}</th>
                <th className="num">{strings.table.amount}</th>
              </tr>
            </thead>
            <tbody>
              {minimumWages.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
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
            {stats.mesaiPay > 0 && (
              <tr>
                <td>{strings.calc.mesaiPay}</td>
                <td className="num">{formatMoney(stats.mesaiPay)}</td>
              </tr>
            )}
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
            {stats.totalMinimum > 0 && (
              <tr>
                <td>{strings.calc.minimumWages}</td>
                <td className="num">− {formatMoney(stats.totalMinimum)}</td>
              </tr>
            )}
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
        <p>
          {formatString(strings.footer.disclaimer, { appName: APP_NAME })}
        </p>
        <div className="payroll-print-signatures">
          <div>
            <span>{strings.footer.employee}</span>
            <div className="line" />
            <small>{employee.name}</small>
          </div>
          <div>
            <span>{strings.footer.employer}</span>
            <div className="line" />
            <small>{strings.footer.signatureHint}</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
