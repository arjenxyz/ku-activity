import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export function AlertBanner({
  type,
  message,
}: {
  type: 'success' | 'error' | 'warning';
  message: string;
}) {
  const styles =
    type === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : type === 'warning'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : 'bg-red-50 text-red-800 border-red-200';

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm mb-4 ${styles}`}>
      {type === 'success' ? (
        <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{message}</span>
    </div>
  );
}
