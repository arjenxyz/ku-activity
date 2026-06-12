'use client';

import { FiBell } from 'react-icons/fi';

type Props = {
  pendingApprovals: number;
  pendingAdminDays: number;
  onGoToWork?: () => void;
};

export function PersonnelAlertBar({
  pendingApprovals,
  pendingAdminDays,
  onGoToWork,
}: Props) {
  const total = pendingApprovals + (pendingAdminDays > 0 ? 1 : 0);
  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <FiBell className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {pendingApprovals > 0
              ? `${pendingApprovals} yevmiye onayınız bekliyor`
              : 'Yönetici onayı bekleyen kayıtlarınız var'}
          </p>
          {pendingAdminDays > 0 && (
            <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-0.5">
              {pendingAdminDays} gün yönetici onayında — onaylanınca maaş hesabına yansır.
            </p>
          )}
        </div>
      </div>
      {pendingApprovals > 0 && onGoToWork && (
        <button
          type="button"
          onClick={onGoToWork}
          className="shrink-0 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
        >
          Kayıtlara git →
        </button>
      )}
    </div>
  );
}
