'use client';

import { FiInfo, FiUpload } from 'react-icons/fi';
import {
  DEKONT_DEDUCTION_LABELS,
  DEFAULT_WAGE_POLICY,
  PRORATION_MODE_LABELS,
  YEVMIYE_TRIGGER_LABELS,
  type DekontDeductionMode,
  type WagePolicy,
  type YevmiyePaymentTrigger,
} from '@/types/wage-policy';
import { getOfficialMonthlyMinimumWageGross } from '@/lib/minimum-wage';
import { cardClass, labelClass, inputClass, btnPrimary } from '@/components/project/ui';
import { formatMoney } from '@/lib/format';

type Props = {
  value: WagePolicy;
  onChange: (policy: WagePolicy) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  saving?: boolean;
  showDekontSection?: boolean;
  title?: string;
  subtitle?: string;
};

export function WagePolicyForm({
  value,
  onChange,
  onSubmit,
  loading,
  saving,
  showDekontSection = true,
  title = 'Maaş ve asgari politikası',
  subtitle = 'Ana yetkili bu ayarları bir kez doldurur; asgari ve yevmiye hesapları buna göre yapılır.',
}: Props) {
  const systemDefault = getOfficialMonthlyMinimumWageGross();

  const toggleTrigger = (trigger: YevmiyePaymentTrigger) => {
    const set = new Set(value.yevmiyePaymentTriggers);
    if (set.has(trigger)) set.delete(trigger);
    else set.add(trigger);
    const next = Array.from(set);
    onChange({
      ...value,
      yevmiyePaymentTriggers: next.length ? next : ['month_end'],
    });
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-8 text-center text-sm text-slate-500`}>Yükleniyor…</div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <section className={`${cardClass} p-4 sm:p-6 space-y-4`}>
        <h2 className="text-base font-semibold text-slate-900">Yevmiye ne zaman ödenir?</h2>
        <p className="text-sm text-slate-600">
          Birden fazla seçebilirsiniz. Sistem bu bilgiyi taşeron borcu ekranlarında hatırlatma olarak
          gösterir; ödeme kaydı yine admin tarafından girilir.
        </p>
        <div className="flex flex-col gap-2">
          {(Object.keys(YEVMIYE_TRIGGER_LABELS) as YevmiyePaymentTrigger[]).map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={value.yevmiyePaymentTriggers.includes(key)}
                onChange={() => toggleTrigger(key)}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">{YEVMIYE_TRIGGER_LABELS[key]}</span>
            </label>
          ))}
        </div>
        <div>
          <label className={labelClass}>Ek not (isteğe bağlı)</label>
          <textarea
            className={`${inputClass} min-h-[72px]`}
            value={value.yevmiyePaymentNotes}
            onChange={(e) => onChange({ ...value, yevmiyePaymentNotes: e.target.value })}
            placeholder="Örn: Çatı ödemesi genelde cumartesi elden yapılır."
          />
        </div>
      </section>

      <section className={`${cardClass} p-4 sm:p-6 space-y-4`}>
        <h2 className="text-base font-semibold text-slate-900">Asgari ücret nasıl hesaplansın?</h2>
        <div className={`rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex gap-3 text-sm text-indigo-950`}>
          <FiInfo className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Karmaşık &quot;brüt/net&quot; terimlerini kullanmıyoruz. Referans:{' '}
            <strong>Devletin belirlediği aylık asgari</strong> (varsayılan {formatMoney(systemDefault)}).
            Personelin yevmiye toplamı bunun altındaysa fark taşeron borcudur.
          </p>
        </div>

        <div>
          <label className={labelClass}>Aylık asgari referans (₺)</label>
          <input
            type="number"
            className={inputClass}
            step="0.01"
            min="0"
            placeholder={`Boş bırak = ${formatMoney(systemDefault)} (sistem varsayılanı)`}
            value={value.officialMonthlyMinimum ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                officialMonthlyMinimum: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={value.prorationFromHireDate}
            onChange={(e) => onChange({ ...value, prorationFromHireDate: e.target.checked })}
            className="rounded border-slate-300"
          />
          Ay ortasında işe girenler için oranlama uygula (işe giriş tarihine göre)
        </label>

        <div>
          <label className={labelClass}>Oranlama yöntemi</label>
          <select
            className={inputClass}
            value={value.prorationMode}
            onChange={(e) =>
              onChange({
                ...value,
                prorationMode: e.target.value as WagePolicy['prorationMode'],
              })
            }
          >
            {(Object.keys(PRORATION_MODE_LABELS) as WagePolicy['prorationMode'][]).map((k) => (
              <option key={k} value={k}>
                {PRORATION_MODE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {showDekontSection && (
        <section className={`${cardClass} p-4 sm:p-6 space-y-4 opacity-90`}>
          <div className="flex items-center gap-2">
            <FiUpload className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Asgari dekontu (yakında)</h2>
          </div>
          <p className="text-sm text-slate-600">
            Banka dekontu veya SGK/BES belgesi yükleyerek ödenen tutarı otomatik okuma hedefleniyor.
            BES, SGK işçi payı gibi kesintiler dekontta farklı satırlarda göründüğü için önce{' '}
            <strong>manuel onay</strong> modu önerilir.
          </p>
          <label className="flex items-center gap-3 text-sm text-slate-500">
            <input type="checkbox" disabled checked={false} className="rounded" />
            Otomatik dekont okuma (henüz aktif değil)
          </label>
          <div>
            <label className={labelClass}>Dekont kesintileri (hazırlık ayarı)</label>
            <select
              className={inputClass}
              value={value.dekontDeductionMode}
              onChange={(e) =>
                onChange({
                  ...value,
                  dekontDeductionMode: e.target.value as DekontDeductionMode,
                })
              }
            >
              {(Object.keys(DEKONT_DEDUCTION_LABELS) as DekontDeductionMode[]).map((k) => (
                <option key={k} value={k}>
                  {DEKONT_DEDUCTION_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Dekont / muhasebe notu</label>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={value.dekontNotes}
              onChange={(e) => onChange({ ...value, dekontNotes: e.target.value })}
              placeholder="Örn: BES kesintisi ayrı satırda, taşeron net yatırıyor."
            />
          </div>
        </section>
      )}

      <button type="submit" className={btnPrimary} disabled={saving}>
        {saving ? 'Kaydediliyor…' : 'Politikayı kaydet'}
      </button>
    </form>
  );
}

export function emptyWagePolicy(): WagePolicy {
  return { ...DEFAULT_WAGE_POLICY };
}
