'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiMail, FiSmartphone } from 'react-icons/fi';
import type { OtpChannel } from '@/lib/otp-delivery';

type Props = {
  email: string;
  phone: string;
  disabled?: boolean;
  onVerified: (token: string, channel: OtpChannel) => void;
  onReset: () => void;
};

export function ContractOtpVerification({ email, phone, disabled, onVerified, onReset }: Props) {
  const [channel, setChannel] = useState<OtpChannel>('email');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const smsAvailable = phone.replace(/\D/g, '').length >= 10;

  useEffect(() => {
    if (!smsAvailable && channel === 'sms') {
      setChannel('email');
    }
  }, [smsAvailable, channel]);

  useEffect(() => {
    setVerified(false);
    setSentTo(null);
    setCode('');
    setError('');
    setInfo('');
    onReset();
  }, [email, phone, channel, onReset]);

  const handleSend = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Önce e-posta adresinizi girin.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/public/contract-otp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel, email: email.trim(), phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod gönderilemedi');
      setSentTo(data.maskedDestination as string);
      setInfo(
        `${data.maskedDestination} adresine ${data.expiresInMinutes} dakika geçerli kod gönderildi.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kod gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/public/contract-otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel, email: email.trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Doğrulama başarısız');
      setVerified(true);
      setInfo('Kimlik doğrulandı. Başvuruyu gönderebilirsiniz.');
      onVerified(data.verificationToken as string, channel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama başarısız');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Sözleşme doğrulaması</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Sözleşmeleri onayladıktan sonra e-posta veya SMS ile tek kullanımlık kod alın (günde en fazla
          20 kod).
        </p>
      </div>

      {!verified && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setChannel('email')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              channel === 'email'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FiMail className="w-3.5 h-3.5" />
            E-posta (ücretsiz)
          </button>
          {smsAvailable && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setChannel('sms')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                channel === 'sms'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              <FiSmartphone className="w-3.5 h-3.5" />
              SMS
            </button>
          )}
        </div>
      )}

      {verified ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 shrink-0" />
          Doğrulama tamamlandı.
        </p>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || sending}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
          >
            {sending ? 'Gönderiliyor…' : sentTo ? 'Yeni kod gönder' : 'Doğrulama kodu gönder'}
          </button>

          {sentTo && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6 haneli kod"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm"
                disabled={disabled || verifying}
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={disabled || verifying || code.length !== 6}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {verifying ? 'Kontrol…' : 'Doğrula'}
              </button>
            </div>
          )}
        </div>
      )}

      {info && <p className="text-xs text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-3 py-2">{info}</p>}
      {error && <p className="text-xs text-red-700 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}
