type AuthAlertProps = {
  message: string;
  type: 'success' | 'error';
  /** Koyu cam arka plan üzerinde */
  tone?: 'default' | 'glass' | 'personnel';
};

export function AuthAlert({ message, type, tone = 'default' }: AuthAlertProps) {
  const isSuccess = type === 'success';
  const isGlass = tone === 'glass';
  const isPersonnel = tone === 'personnel';

  return (
    <div
      className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
        isPersonnel
          ? isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
          : isGlass
            ? isSuccess
              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-100 backdrop-blur-md'
              : 'bg-red-500/15 border-red-400/30 text-red-100 backdrop-blur-md'
            : isSuccess
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      }`}
    >
      <div className="flex items-start gap-2">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          {isSuccess ? (
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          ) : (
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          )}
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
