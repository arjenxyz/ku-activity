'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

type Props = {
  managerPhone?: string | null;
};

export function PersonnelTrustFooter({ managerPhone }: Props) {
  const whatsappUrl = managerPhone ? buildWhatsAppUrl(managerPhone) : null;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 shadow-sm p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        Veriler yöneticinizle aynıdır. Tüm veriler çift onay ile onaylanmaktadır; herhangi bir
        yanlışlık söz konusu değildir, sistemimiz buna izin vermemektedir.
      </p>

      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold shadow-sm transition-colors min-h-[44px]"
        >
          <FaWhatsapp className="w-5 h-5 shrink-0" aria-hidden />
          <span>Yöneticiniz ile iletişime geçmek için tıklayınız</span>
        </a>
      ) : (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Yönetici WhatsApp numarası tanımlı değil.
        </p>
      )}
    </div>
  );
}
