'use client';

import { FormEvent, useEffect, useState } from 'react';
import { approveSignupCode, listSignups, type LocalSignup } from '@/lib/demo/local-accounts';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import { cardClass } from '@/components/ui/styles';

export function SignupApproval() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<LocalSignup[]>([]);

  function refresh() {
    setPending(listSignups().filter((item) => item.status === 'pending'));
  }

  useEffect(() => {
    refresh();
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const match = listSignups().find((item) => item.approvalCode.toUpperCase() === code.trim().toUpperCase());
    if (!match) {
      setError('Bu koda ait bekleyen kayıt yok. Öğrenci kimliğini kontrol et.');
      return;
    }
    if (match.status === 'approved') {
      setMessage(`${match.fullName} zaten onaylı.`);
      return;
    }
    approveSignupCode(code);
    setMessage(`${match.fullName} onaylandı. Öğrenci kimliği görüldü.`);
    setCode('');
    refresh();
  }

  return (
    <div className={`${cardClass} p-6`}>
      <h2 className="text-lg font-bold text-[#0E1548]">Kayıt onayı</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Öğrenci kimlik kartıyla gelmeden onaylama. QR kodu okut veya ekrandaki kodu gir.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="approval-code" className={labelClass}>
            Onay kodu
          </label>
          <input
            id="approval-code"
            className={inputClass}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="KU-...."
            autoComplete="off"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
        <button type="submit" className={primaryButtonClass}>
          Kimlik görüldü, onayla
        </button>
      </form>
      {pending.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {pending.map((item) => (
            <li key={item.email} className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-medium">{item.fullName}</span>
              <span className="text-slate-500"> · {item.studentNo}</span>
              <span className="block text-xs text-[#0E1548]">{item.approvalCode}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
