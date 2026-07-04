'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import QRCode from 'qrcode';
import Link from 'next/link';
import { FiCheck, FiCreditCard, FiRefreshCw, FiShare2, FiUpload, FiX } from 'react-icons/fi';
import strings from '@json/src/components/advance/AdminAdvanceRequestsPanel.json';
import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { cardClass, btnPrimary, btnSecondary, labelClass, inputClass } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';
import { formatString } from '@/lib/strings/format';
import {
  ADVANCE_PAYMENT_METHOD_LABELS,
  ADVANCE_STATUS_LABELS,
  advanceDisplayAmount,
  canApproveAdvance,
  canRejectAdvance,
  type AdvancePaymentMethod,
  type AdvanceRequestRow,
} from '@/lib/advance-types';

type Props = { projectId: string };

const STATUS_FILTER_VALUES = [
  '',
  'pending',
  'approved',
  'awaiting_receipt',
  'paid',
  'rejected',
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_VALUES)[number];

function statusFilterLabel(value: StatusFilterValue): string {
  if (value === '') return strings.filters.all;
  return strings.filters[value];
}

export function AdminAdvanceRequestsPanel({ projectId }: Props) {
  const { jobs } = useProjectJobs(projectId);
  const [requests, setRequests] = useState<AdvanceRequestRow[]>([]);
  const [filter, setFilter] = useState<StatusFilterValue>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [approveTarget, setApproveTarget] = useState<AdvanceRequestRow | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [approveMethod, setApproveMethod] = useState<AdvancePaymentMethod>('bank_transfer');
  const [approveNote, setApproveNote] = useState('');
  const [approveJobId, setApproveJobId] = useState('');

  const [paymentTarget, setPaymentTarget] = useState<AdvanceRequestRow | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [cashTarget, setCashTarget] = useState<AdvanceRequestRow | null>(null);
  const [cashQr, setCashQr] = useState<{ token: string; qrDataUrl: string; expiresAt: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/projects/${projectId}/advance-requests${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.listLoadFailed);
      setRequests(data.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.listLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [projectId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openApprove = (row: AdvanceRequestRow) => {
    setApproveTarget(row);
    setApproveAmount(String(row.requested_amount));
    setApproveMethod('bank_transfer');
    setApproveNote('');
    setApproveJobId('');
    setSuccess(null);
    setError(null);
  };

  const submitApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/advance-requests/${approveTarget.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approvedAmount: Number(approveAmount),
            paymentMethod: approveMethod,
            adminNote: approveNote || undefined,
            jobId: approveJobId || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.approveFailed);
      setApproveTarget(null);
      setSuccess(
        approveMethod === 'cash' ? strings.approveSuccessCash : strings.approveSuccessTransfer
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.approveFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async (row: AdvanceRequestRow) => {
    const reason = window.prompt(strings.rejectPrompt) ?? '';
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/advance-requests/${row.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.rejectFailed);
      setSuccess(strings.rejectSuccess);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.rejectFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || !paymentFile) return;
    setActionLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', paymentFile);
      if (paymentRef) form.append('referenceNo', paymentRef);
      form.append('paymentDate', paymentDate);
      const res = await fetch(
        `/api/admin/projects/${projectId}/advance-requests/${paymentTarget.id}/record-payment`,
        { method: 'POST', body: form }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.paymentRecordFailed);
      setPaymentTarget(null);
      setPaymentFile(null);
      setSuccess(strings.paymentRecordSuccess);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.paymentRecordFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const loadCashQr = async (row: AdvanceRequestRow, regenerate = false) => {
    setCashTarget(row);
    setCashQr(null);
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/advance-requests/${row.id}/cash-qr${regenerate ? '?regenerate=1' : ''}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.qrLoadFailed);
      const qrDataUrl =
        data.qrDataUrl ?? (await QRCode.toDataURL(data.qrUrl, { margin: 1, width: 280 }));
      setCashQr({ token: data.token, qrDataUrl, expiresAt: data.expiresAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.qrLoadFailed);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <ProjectPageHeader title={strings.title} description={strings.description} />

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <Link
        href="/admin-panel/dekont-paylas"
        className={`${cardClass} mb-6 flex items-center gap-3 border-blue-200 bg-blue-50/80 text-blue-900 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200`}
      >
        <FiShare2 className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{strings.dekontTitle}</p>
          <p className="text-sm opacity-80">{strings.dekontDescription}</p>
        </div>
      </Link>

      <div className={`${cardClass} mb-6`}>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_VALUES.map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {statusFilterLabel(value)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> {strings.refresh}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">{strings.loading}</p>
      ) : requests.length === 0 ? (
        <div className={`${cardClass} py-12 text-center text-sm text-slate-500`}>
          {strings.emptyFilter}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((row) => (
            <article key={row.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {row.employees?.name ?? strings.defaultEmployeeName}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {dayjs(row.requested_at).format('DD MMM YYYY HH:mm')}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {ADVANCE_STATUS_LABELS[row.status]}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">{strings.requestedAmount}</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(row.requested_amount)}</dd>
                </div>
                {row.approved_amount != null && (
                  <div>
                    <dt className="text-slate-500">{strings.approvedAmount}</dt>
                    <dd className="font-semibold tabular-nums text-emerald-600">
                      {formatMoney(row.approved_amount)}
                    </dd>
                  </div>
                )}
                {row.payment_method && (
                  <div>
                    <dt className="text-slate-500">{strings.paymentMethod}</dt>
                    <dd>{ADVANCE_PAYMENT_METHOD_LABELS[row.payment_method]}</dd>
                  </div>
                )}
                {row.employee_note && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">{strings.employeeNote}</dt>
                    <dd>{row.employee_note}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {canApproveAdvance(row.status) && (
                  <button type="button" className={btnPrimary} onClick={() => openApprove(row)}>
                    <FiCheck className="mr-1 inline" /> {strings.approveButton}
                  </button>
                )}
                {row.status === 'approved' && row.payment_method === 'bank_transfer' && (
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => {
                      setPaymentTarget(row);
                      setPaymentFile(null);
                      setPaymentRef('');
                      setPaymentDate(dayjs().format('YYYY-MM-DD'));
                    }}
                  >
                    <FiUpload className="mr-1 inline" /> {strings.recordPayment}
                  </button>
                )}
                {row.status === 'awaiting_receipt' && row.payment_method === 'cash' && (
                  <button type="button" className={btnPrimary} onClick={() => void loadCashQr(row)}>
                    <FiCreditCard className="mr-1 inline" /> {strings.showCashQr}
                  </button>
                )}
                {canRejectAdvance(row.status) && (
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={actionLoading}
                    onClick={() => void submitReject(row)}
                  >
                    <FiX className="mr-1 inline" /> {strings.reject}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitApprove} className={`${cardClass} w-full max-w-md`}>
            <h3 className="text-lg font-semibold">{strings.approveModalTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatString(strings.approveModalSubtitle, {
                name: approveTarget.employees?.name ?? strings.defaultEmployeeName,
                amount: formatMoney(approveTarget.requested_amount),
              })}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>{strings.approveAmountLabel}</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.paymentMethodLabel}</label>
                <select
                  className={inputClass}
                  value={approveMethod}
                  onChange={(e) => setApproveMethod(e.target.value as AdvancePaymentMethod)}
                >
                  <option value="bank_transfer">{strings.bankTransfer}</option>
                  <option value="cash">{strings.cash}</option>
                </select>
              </div>
              <JobSelectField jobs={jobs} value={approveJobId} onChange={setApproveJobId} />
              <div>
                <label className={labelClass}>{strings.adminNoteLabel}</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="submit" className={btnPrimary} disabled={actionLoading}>
                {strings.approve}
              </button>
              <button type="button" className={btnSecondary} onClick={() => setApproveTarget(null)}>
                {strings.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitPayment} className={`${cardClass} w-full max-w-md`}>
            <h3 className="text-lg font-semibold">{strings.paymentModalTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatString(strings.paymentModalSubtitle, {
                name: paymentTarget.employees?.name ?? strings.defaultEmployeeName,
                amount: formatMoney(advanceDisplayAmount(paymentTarget)),
              })}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>{strings.receiptLabel}</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  required
                  className={inputClass}
                  onChange={(e) => setPaymentFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.referenceLabel}</label>
                <input
                  className={inputClass}
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.paymentDateLabel}</label>
                <input
                  type="date"
                  className={inputClass}
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="submit" className={btnPrimary} disabled={actionLoading || !paymentFile}>
                {strings.save}
              </button>
              <button type="button" className={btnSecondary} onClick={() => setPaymentTarget(null)}>
                {strings.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {cashTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={`${cardClass} w-full max-w-sm text-center`}>
            <h3 className="text-lg font-semibold">{strings.cashQrTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatString(strings.cashQrSubtitle, {
                name: cashTarget.employees?.name ?? strings.defaultEmployeeName,
                amount: formatMoney(advanceDisplayAmount(cashTarget)),
              })}
            </p>
            {cashQr ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cashQr.qrDataUrl} alt={strings.cashQrAlt} className="mx-auto mt-4 rounded-xl" />
                <p className="mt-3 font-mono text-sm font-bold tracking-wider">{cashQr.token}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatString(strings.validUntil, {
                    date: dayjs(cashQr.expiresAt).format('DD MMM YYYY HH:mm'),
                  })}
                </p>
              </>
            ) : (
              <p className="py-8 text-sm text-slate-500">{strings.qrGenerating}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => void loadCashQr(cashTarget, true)}
                disabled={actionLoading}
              >
                {strings.newCode}
              </button>
              <button type="button" className={btnPrimary} onClick={() => setCashTarget(null)}>
                {strings.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
