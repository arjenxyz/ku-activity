'use client';

import { useState } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { joinProjectCollab } from '@/lib/project-api';
import { formatString } from '@/lib/strings/format';

type Props = {
  onJoined: () => void;
};

export function JoinProjectCollabCard({ onJoined }: Props) {
  const strings = useRegistryStrings('app/admin-panel/page');
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActing(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await joinProjectCollab(code);
      setSuccess(formatString(strings.joinCollab.success, { name: result.projectName }));
      setCode('');
      onJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.joinCollab.failed);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#0E1548]">
            <FiUserPlus className="h-4 w-4" />
            {strings.joinCollab.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{strings.joinCollab.hint}</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#0E1548]/20 bg-[#0E1548]/5 px-4 py-2 text-sm font-semibold text-[#0E1548] hover:bg-[#0E1548]/10"
          >
            {strings.joinCollab.open}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={strings.joinCollab.placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-[#0E1548] focus:ring-2 focus:ring-[#0E1548]/20"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-700">{success}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={acting || !code.trim()}
              className="flex-1 rounded-xl bg-[#0E1548] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {acting ? strings.joinCollab.saving : strings.joinCollab.submit}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium"
            >
              {strings.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
