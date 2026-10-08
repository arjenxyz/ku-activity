import { btnPrimary, inputClass, labelClass } from '@/components/ui/styles';

function RegisterPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'bg-slate-50 p-4' : 'bg-gradient-to-b from-white to-slate-50 p-6'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">Kayıt</p>
      <h3 className={`mt-1 font-bold text-[#0E1548] ${compact ? 'text-base' : 'text-xl'}`}>
        Etkinliğe kayıt ol
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Etkinliği seç, bilgilerini yaz, kaydı tamamla.
      </p>
      <div className={`mt-4 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <p className={labelClass}>Ad soyad</p>
          <div className={inputClass}>Ayşe Yılmaz</div>
        </div>
        <div>
          <p className={labelClass}>Öğrenci no</p>
          <div className={inputClass}>202100184</div>
        </div>
      </div>
      <div className="mt-3">
        <p className={labelClass}>Etkinlik</p>
        <div className={inputClass}>Seçili etkinlik</div>
      </div>
      <div className={`${btnPrimary} pointer-events-none mt-4 !w-full`}>Kaydı tamamla</div>
    </div>
  );
}

export function RegistrationPreview() {
  return (
    <>
      <div className="mx-auto hidden w-full max-w-sm sm:block lg:hidden" aria-hidden>
        <div className="rounded-[2rem] border-[10px] border-[#0E1548] bg-[#0E1548] shadow-xl shadow-slate-900/15">
          <div className="overflow-hidden rounded-[1.25rem] bg-white">
            <div className="flex justify-center bg-white py-2">
              <span className="h-1.5 w-16 rounded-full bg-slate-200" />
            </div>
            <RegisterPreview compact />
          </div>
        </div>
      </div>

      <div className="hidden lg:block" aria-hidden>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
              /kayit
            </span>
          </div>
          <RegisterPreview />
        </div>
      </div>
    </>
  );
}
