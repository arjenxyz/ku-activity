'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { FiShield } from 'react-icons/fi';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || '';

type Props = {
  managerPhone?: string | null;
  managerName?: string | null;
};

export function PersonnelTrustFooter({ managerPhone, managerName }: Props) {
  const phone = managerPhone?.trim() || SUPPORT_WHATSAPP;
  const whatsappUrl = phone ? buildWhatsAppUrl(phone) : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 shadow-sm p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <FiShield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Veri güvenliği
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Veriler yöneticinizle aynıdır. Tüm kayıtlar{' '}
              <span className="font-medium text-slate-800 dark:text-slate-100">çift onay</span> ile
              kesinleşir; sistem tek taraflı değişikliğe izin vermez.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          whatsappUrl
            ? 'border-[#25D366]/25 dark:border-emerald-800/50 bg-gradient-to-br from-[#E7F8ED] via-white to-[#F0FDF4] dark:from-emerald-950/25 dark:via-slate-800 dark:to-slate-900'
            : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  whatsappUrl
                    ? 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/35'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <FaWhatsapp className="w-7 h-7" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {managerName ? `${managerName} · Yönetici` : 'Proje yöneticisi'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Puantaj veya maaş hakkında sorularınız için WhatsApp
                </p>
              </div>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto shrink-0 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] active:bg-[#1DA851] text-white text-sm font-semibold shadow-md shadow-[#25D366]/30 transition-colors min-h-[44px]"
              >
                <FaWhatsapp className="w-5 h-5 shrink-0" aria-hidden />
                WhatsApp&apos;ta yaz
              </a>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-right">
                Yönetici numarası henüz tanımlı değil
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
