'use client';

import { APP_NAME } from '@/lib/brand';
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

function mesaiLabel(type: string | null | undefined) {
  if (!type || type === 'none') return '—';
  if (type === 'ceyrek') return 'Çeyrek';
  if (type === 'yarim') return 'Yarım';
  if (type === 'tam') return 'Tam';
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
          <h1 className="payroll-print-title">Maaş Dökümü</h1>
          <p className="payroll-print-sub">{period}</p>
        </div>
        <div className="payroll-print-meta">
          <p>
            <strong>Yazdırma:</strong> {printedAt}
          </p>
          <p>
            <strong>Belge no:</strong> {employee.id.slice(0, 8).toUpperCase()}-{month.replace('-', '')}
          </p>
        </div>
      </header>

      <section className="payroll-print-section">
        <h2>Personel bilgileri</h2>
        <table className="payroll-print-info">
          <tbody>
            <tr>
              <td>Ad soyad</td>
              <td>{employee.name}</td>
              <td>Pozisyon</td>
              <td>{employee.position || '—'}</td>
            </tr>
            <tr>
              <td>Proje / şantiye</td>
              <td>{employee.project?.name ?? employee.project_name ?? '—'}</td>
              <td>Günlük yevmiye</td>
              <td>{formatMoney(dailyWage)}</td>
            </tr>
            {tcDisplay && (
              <tr>
                <td>T.C. kimlik</td>
                <td>{tcDisplay}</td>
                <td>İşe giriş</td>
                <td>{employee.hire_date ? formatDate(employee.hire_date) : '—'}</td>
              </tr>
            )}
            {!tcDisplay && employee.hire_date && (
              <tr>
                <td>İşe giriş</td>
                <td colSpan={3}>{formatDate(employee.hire_date)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="payroll-print-section">
        <h2>Dönem özeti</h2>
        <div className="payroll-print-summary-grid">
          <div>
            <span>Çalışılan gün</span>
            <strong>{stats.workDays}</strong>
          </div>
          <div>
            <span>Onaylı gün</span>
            <strong>{stats.approvedDays}</strong>
          </div>
          <div>
            <span>Bekleyen gün</span>
            <strong>{stats.pendingDays}</strong>
          </div>
          <div>
            <span>Mesai birimi</span>
            <strong>{stats.mesaiUnits.toFixed(2)}</strong>
          </div>
          <div className="payroll-print-net">
            <span>Net tahmini</span>
            <strong>{formatMoney(stats.net)}</strong>
          </div>
        </div>
      </section>

      <section className="payroll-print-section">
        <h2>Yevmiye kayıtları ({sortedLogs.length})</h2>
        {sortedLogs.length === 0 ? (
          <p className="payroll-print-empty">Bu dönemde yevmiye kaydı yok.</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Çalışma</th>
                <th>Mesai</th>
                <th className="num">Yevmiye</th>
                <th className="num">Mesai ₺</th>
                <th className="num">Satır toplam</th>
                <th>Durum</th>
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
                    <td>{mesaiLabel(String(log.mesai_type ?? ''))}</td>
                    <td className="num">{formatMoney(base)}</td>
                    <td className="num">{mesai > 0 ? formatMoney(mesai) : '—'}</td>
                    <td className="num">{formatMoney(base + mesai)}</td>
                    <td>{approvalStatusLabel(status)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Toplam</strong>
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
          <h2>Mesai özeti</h2>
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>Tür</th>
                <th className="num">Kayıt</th>
                <th className="num">Birim</th>
                <th className="num">Tutar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Çeyrek mesai</td>
                <td className="num">{mesaiStats.byType.ceyrek.count}</td>
                <td className="num">{mesaiStats.byType.ceyrek.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.ceyrek.pay)}</td>
              </tr>
              <tr>
                <td>Yarım mesai</td>
                <td className="num">{mesaiStats.byType.yarim.count}</td>
                <td className="num">{mesaiStats.byType.yarim.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.yarim.pay)}</td>
              </tr>
              <tr>
                <td>Tam mesai</td>
                <td className="num">{mesaiStats.byType.tam.count}</td>
                <td className="num">{mesaiStats.byType.tam.units.toFixed(2)}</td>
                <td className="num">{formatMoney(mesaiStats.byType.tam.pay)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <strong>Genel toplam</strong>
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
        <h2>Avanslar ({advances.length})</h2>
        {advances.length === 0 ? (
          <p className="payroll-print-empty">Avans kaydı yok.</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th className="num">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.description || 'Avans'}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Toplam avans</strong>
                </td>
                <td className="num">{formatMoney(stats.totalAdvance)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section">
        <h2>Kesintiler ({otherDeductions.length})</h2>
        {otherDeductions.length === 0 ? (
          <p className="payroll-print-empty">Kesinti kaydı yok.</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tür</th>
                <th>Açıklama</th>
                <th className="num">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {otherDeductions.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{deductionTypeLabel(r.type)}</td>
                  <td>{r.description || '—'}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Toplam kesinti</strong>
                </td>
                <td className="num">{formatMoney(stats.totalDeduct)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section">
        <h2>Asgari ücret ödemeleri ({minimumWages.length})</h2>
        {minimumWages.length === 0 ? (
          <p className="payroll-print-empty">Asgari ücret tamamlama ödemesi yok.</p>
        ) : (
          <table className="payroll-print-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th className="num">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {minimumWages.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.description || 'Asgari ücret tamamlama'}</td>
                  <td className="num">{formatMoney(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>
                  <strong>Toplam asgari ödeme</strong>
                </td>
                <td className="num">{formatMoney(stats.totalMinimum)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="payroll-print-section payroll-print-calc">
        <h2>Hesaplama özeti</h2>
        <table className="payroll-print-calc-table">
          <tbody>
            <tr>
              <td>
                Yevmiye ({stats.workDays} gün × {formatMoney(dailyWage)})
              </td>
              <td className="num">{formatMoney(stats.basePay)}</td>
            </tr>
            {stats.mesaiPay > 0 && (
              <tr>
                <td>Mesai kazancı (+)</td>
                <td className="num">{formatMoney(stats.mesaiPay)}</td>
              </tr>
            )}
            <tr className="subtotal">
              <td>
                <strong>Brüt toplam</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(stats.gross)}</strong>
              </td>
            </tr>
            <tr>
              <td>Avanslar (−)</td>
              <td className="num">− {formatMoney(stats.totalAdvance)}</td>
            </tr>
            <tr>
              <td>Kesintiler (−)</td>
              <td className="num">− {formatMoney(stats.totalDeduct)}</td>
            </tr>
            {stats.totalMinimum > 0 && (
              <tr>
                <td>Asgari ücret ödemeleri (+)</td>
                <td className="num">{formatMoney(stats.totalMinimum)}</td>
              </tr>
            )}
            <tr className="total">
              <td>
                <strong>Net tahmini ödeme</strong>
              </td>
              <td className="num">
                <strong>{formatMoney(stats.net)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="payroll-print-note">
          Net tutar: Brüt ({formatMoney(stats.gross)}) − Avans ({formatMoney(stats.totalAdvance)})
          − Kesinti ({formatMoney(stats.totalDeduct)})
          {stats.totalMinimum > 0 ? ` + Asgari (${formatMoney(stats.totalMinimum)})` : ''} ={' '}
          {formatMoney(stats.net)}
        </p>
      </section>

      <footer className="payroll-print-footer">
        <p>
          Bu belge bilgilendirme amaçlıdır. Resmi bordro yerine geçmez. Kayıtlar {APP_NAME}{' '}
          personel paneli ile yönetici panelinden aynı veritabanından üretilmiştir.
        </p>
        <div className="payroll-print-signatures">
          <div>
            <span>Personel</span>
            <div className="line" />
            <small>{employee.name}</small>
          </div>
          <div>
            <span>Yönetici / İşveren</span>
            <div className="line" />
            <small>Ad soyad · Tarih · İmza</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
