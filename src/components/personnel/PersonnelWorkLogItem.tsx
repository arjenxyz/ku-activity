'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  approvalStatusLabel,
  formatWorkLogSummary,
  getWorkLogApprovalStatus,
} from '@/lib/work-log';
import type { WorkLog } from '@/lib/personnel-stats';
import { confirmPersonnelAttendance, disputePersonnelWorkLog } from '@/lib/personnel-api';
import { PersonnelBadge, PersonnelRecordRow } from './PersonnelRecordCard';
import { workDayLabel } from '@/lib/personnel-stats';

type Props = {
  log: WorkLog;
  onUpdated?: () => void;
  showActions?: boolean;
};

function approvalBadge(log: WorkLog) {
  const status = getWorkLogApprovalStatus(log);
  if (status === 'confirmed') {
    return <PersonnelBadge variant="success">Onaylı</PersonnelBadge>;
  }
  if (status === 'disputed') {
    return <PersonnelBadge variant="warning">İtiraz</PersonnelBadge>;
  }
  if (status === 'pending_employee') {
    return <PersonnelBadge variant="warning">Sizin onayınız</PersonnelBadge>;
  }
  if (status === 'pending_admin') {
    return <PersonnelBadge variant="warning">Yönetici bekliyor</PersonnelBadge>;
  }
  return <PersonnelBadge variant="warning">{approvalStatusLabel(status)}</PersonnelBadge>;
}

export function PersonnelWorkLogItem({ log, onUpdated, showActions }: Props) {
  const [busy, setBusy] = useState<'confirm' | 'dispute' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');

  const status = getWorkLogApprovalStatus(log);
  const canAct = showActions && status === 'pending_employee';

  const handleConfirm = async () => {
    setBusy('confirm');
    setError(null);
    try {
      await confirmPersonnelAttendance(log.date);
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onay kaydedilemedi');
    } finally {
      setBusy(null);
    }
  };

  const handleDispute = async () => {
    setBusy('dispute');
    setError(null);
    try {
      await disputePersonnelWorkLog(log.id, disputeNote);
      setDisputeOpen(false);
      setDisputeNote('');
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İtiraz kaydedilemedi');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border-b border-gray-100 dark:border-slate-700 last:border-0">
      <PersonnelRecordRow
        left={formatDate(log.date)}
        right={
          <div className="flex flex-col items-end gap-1">
            <PersonnelBadge variant={log.amount === 1 ? 'success' : 'warning'}>
              {workDayLabel(Number(log.amount), log.mesai_type)}
            </PersonnelBadge>
            {approvalBadge(log)}
          </div>
        }
        sub={
          log.description ||
          formatWorkLogSummary(Number(log.amount), log.mesai_type ?? null)
        }
      />
      <div className="px-4 sm:px-6 pb-3 -mt-1 space-y-2">
        {(log.admin_confirmed_at || log.employee_confirmed_at) && (
          <div className="text-[11px] text-slate-500 flex flex-col gap-0.5">
            {log.admin_confirmed_at && (
              <span className="inline-flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                Yönetici: {formatDateTime(log.admin_confirmed_at)}
              </span>
            )}
            {log.employee_confirmed_at && (
              <span className="inline-flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Sizin onayınız: {formatDateTime(log.employee_confirmed_at)}
              </span>
            )}
          </div>
        )}
        {log.employee_disputed_at && status === 'disputed' && (
          <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1.5">
            <FiAlertTriangle className="inline w-3.5 h-3.5 mr-1" />
            İtiraz ({formatDateTime(log.employee_disputed_at)}): {log.employee_dispute_note}
          </p>
        )}
        {canAct && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleConfirm()}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              {busy === 'confirm' ? 'Kaydediliyor…' : 'Onayla'}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setDisputeOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-200 text-xs font-semibold"
            >
              <FiAlertTriangle className="w-3.5 h-3.5" />
              Hatalı kayıt
            </button>
          </div>
        )}
        {disputeOpen && canAct && (
          <div className="space-y-2 pt-1">
            <textarea
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[72px]"
              placeholder="Örn. O gün işe gelmedim / yarım gün değildi…"
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
            />
            <button
              type="button"
              disabled={busy !== null || disputeNote.trim().length < 5}
              onClick={() => void handleDispute()}
              className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              {busy === 'dispute' ? 'Gönderiliyor…' : 'İtirazı gönder'}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
