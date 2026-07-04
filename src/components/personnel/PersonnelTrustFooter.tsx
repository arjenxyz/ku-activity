'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatString } from '@/lib/strings/format';

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || '';

type Props = {
  managerPhone?: string | null;
  managerName?: string | null;
};

export function PersonnelTrustFooter({ managerPhone, managerName }: Props) {

  const strings = useRegistryStrings('components/personnel/PersonnelTrustFooter');
  const phone = managerPhone?.trim() || SUPPORT_WHATSAPP;
  const whatsappUrl = phone ? buildWhatsAppUrl(phone) : null;

  return (
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
                  {managerName
                    ? formatString(strings.managerWithName, { name: managerName })
                    : strings.defaultManager}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {strings.hint}
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
                {strings.whatsappCta}
              </a>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-right">
                {strings.noPhone}
              </p>
            )}
          </div>
        </div>
      </div>
  );
}
