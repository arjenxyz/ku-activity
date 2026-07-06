'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import dayjs from 'dayjs';
import QRCode from 'qrcode';
import Link from 'next/link';
import { FiCheck, FiCopy, FiCreditCard, FiPlus, FiRefreshCw, FiShare2, FiUpload, FiX } from 'react-icons/fi';

import { AlertBanner } from '@/components/project/AlertBanner';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { JobSelectField } from '@/components/project/JobSelectField';
import { useProjectJobs } from '@/hooks/useProjectJobs';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
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
import { getRegistryStrings } from '@/lib/i18n/strings-registry';

type AdvanceStrings = ReturnType<typeof getRegistryStrings<'components/advance/AdminAdvanceRequestsPanel'>>;

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

function statusFilterLabel(value: StatusFilterValue, strings: AdvanceStrings): string {
  if (value === '') return strings.filters.all;
  return strings.filters[value];
}

export function AdminAdvanceRequestsPanel({ projectId }: Props) {

  const strings = useRegistryStrings('components/advance/AdminAdvanceRequestsPanel');
  const { jobs } = useProjectJobs(projectId);
  const { employees } = useProjectEmployees(projectId);
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

  const [transferCodeTarget, setTransferCodeTarget] = useState<AdvanceRequestRow | null>(null);
  const [transferCode, setTransferCode] = useState<{ token: string; expiresAt: string } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createEmployeeId, setCreateEmployeeId] = useState('');
  const [createAmount, setCreateAmount] = useState('');
  const [createNote, setCreateNote] = useState('');
  const [createAdminNote, setCreateAdminNote] = useState('');

  const [approveRetroactive, setApproveRetroactive] = useState(false);
  const [approvePaymentDate, setApprovePaymentDate] = useState(dayjs().format('YYYY-MM-DD'));

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
    setApproveRetroactive(false);
    setApprovePaymentDate(dayjs().format('YYYY-MM-DD'));
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
            retroactive: approveRetroactive && approveMethod === 'bank_transfer',
            paymentDate:
              approveRetroactive && approveMethod === 'bank_transfer'
                ? approvePaymentDate
                : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.approveFailed);
      const approvedRow = approveTarget;
      setApproveTarget(null);
      if (approveMethod === 'cash') {
        setSuccess(strings.approveSuccessCash);
      } else if (approveRetroactive) {
        setSuccess(strings.retroactiveApproveSuccess);
      } else if (data.transferToken) {
        setSuccess(
          formatString(strings.approveSuccessTransferCode, { code: data.transferToken as string })
        );
        if (approvedRow) {
          setTransferCodeTarget(approvedRow);
          setTransferCode({
            token: data.transferToken as string,
            expiresAt: (data.transferTokenExpiresAt as string) ?? '',
          });
        }
      } else {
        setSuccess(strings.approveSuccessTransfer);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.approveFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/advance-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: createEmployeeId,
          amount: Number(createAmount),
          note: createNote || undefined,
          adminNote: createAdminNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.createFailed);
      setCreateOpen(false);
      setCreateEmployeeId('');
      setCreateAmount('');
      setCreateNote('');
      setCreateAdminNote('');
      setSuccess(strings.createSuccess);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.createFailed);
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

  const loadTransferCode = async (row: AdvanceRequestRow, regenerate = false) => {
    setTransferCodeTarget(row);
    setTransferCode(null);
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${projectId}/advance-requests/${row.id}/transfer-code${regenerate ? '?regenerate=1' : ''}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || strings.transferCodeLoadFailed);
      setTransferCode({ token: data.token, expiresAt: data.expiresAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.transferCodeLoadFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const copyTransferCode = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setSuccess(strings.codeCopied);
    } catch {
      setError(strings.codeCopyFailed);
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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
                {statusFilterLabel(value, strings)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => setCreateOpen(true)}>
              <FiPlus className="mr-1 inline" /> {strings.createOnBehalf}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> {strings.refresh}
            </button>
          </div>
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
                  <>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => void loadTransferCode(row)}
                    >
                      <FiCopy className="mr-1 inline" /> {strings.showTransferCode}
                    </button>
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
                  </>
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
                  onChange={(e) => {
                    const method = e.target.value as AdvancePaymentMethod;
                    setApproveMethod(method);
                    if (method !== 'bank_transfer') setApproveRetroactive(false);
                  }}
                >
                  <option value="bank_transfer">{strings.bankTransfer}</option>
                  <option value="cash">{strings.cash}</option>
                </select>
              </div>
              {approveMethod === 'bank_transfer' && (
                <>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={approveRetroactive}
                      onChange={(e) => setApproveRetroactive(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">{strings.retroactiveApprove}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{strings.retroactiveApproveHint}</span>
                    </span>
                  </label>
                  {approveRetroactive && (
                    <div>
                      <label className={labelClass}>{strings.retroactivePaymentDateLabel}</label>
                      <input
                        type="date"
                        className={inputClass}
                        required
                        value={approvePaymentDate}
                        onChange={(e) => setApprovePaymentDate(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
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

      {(transferCodeTarget || transferCode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className={`${cardClass} w-full max-w-sm`}>
            <h3 className="text-lg font-semibold">{strings.transferCodeTitle}</h3>
            {transferCodeTarget && (
              <p className="mt-1 text-sm text-slate-500">
                {formatString(strings.transferCodeSubtitle, {
                  name: transferCodeTarget.employees?.name ?? strings.defaultEmployeeName,
                  amount: formatMoney(advanceDisplayAmount(transferCodeTarget)),
                })}
              </p>
            )}
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{strings.transferCodeInstruction}</p>
            {transferCode ? (
              <>
                <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-center font-mono text-lg font-bold tracking-wider text-slate-900 dark:bg-slate-800 dark:text-white">
                  {transferCode.token}
                </p>
                {transferCode.expiresAt && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    {formatString(strings.validUntil, {
                      date: dayjs(transferCode.expiresAt).format('DD MMM YYYY HH:mm'),
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">{strings.transferCodeLoading}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {transferCode && (
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => void copyTransferCode(transferCode.token)}
                >
                  <FiCopy className="mr-1 inline" /> {strings.copyCode}
                </button>
              )}
              {transferCodeTarget && (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => void loadTransferCode(transferCodeTarget, true)}
                  disabled={actionLoading}
                >
                  {strings.newCode}
                </button>
              )}
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setTransferCodeTarget(null);
                  setTransferCode(null);
                }}
              >
                {strings.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitCreate} className={`${cardClass} w-full max-w-md`}>
            <h3 className="text-lg font-semibold">{strings.createModalTitle}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>{strings.createEmployeeLabel}</label>
                <select
                  className={inputClass}
                  required
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value)}
                >
                  <option value="">{strings.createEmployeeLabel}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{strings.createAmountLabel}</label>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.createNoteLabel}</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{strings.createAdminNoteLabel}</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={createAdminNote}
                  onChange={(e) => setCreateAdminNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="submit" className={btnPrimary} disabled={actionLoading}>
                {strings.createSubmit}
              </button>
              <button type="button" className={btnSecondary} onClick={() => setCreateOpen(false)}>
                {strings.cancel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
