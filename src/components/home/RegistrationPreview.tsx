'use client';

import { useEffect, useState } from 'react';
import { FiCalendar, FiCheckCircle, FiCreditCard, FiMapPin, FiUploadCloud } from 'react-icons/fi';
import { btnPrimary } from '@/components/ui/styles';

const EVENT_NAME = 'Kampüs tanışma buluşması';

type DemoStep = 'event' | 'join' | 'payment' | 'success';

function RegisterPreview({
  compact = false,
  step,
}: {
  compact?: boolean;
  step: DemoStep;
}) {
  return (
    <div className={`relative ${compact ? 'bg-slate-50 p-4' : 'bg-gradient-to-b from-white to-slate-50 p-6'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D6AF6]">Etkinlik kaydı</p>
        <span className="text-[10px] font-medium text-slate-400">Demo akışı</span>
      </div>
      <h3 className={`mt-1 font-bold text-[#0E1548] ${compact ? 'text-base' : 'text-xl'}`}>
        {step === 'event'
          ? 'Etkinlik detaylarını keşfet'
          : step === 'join'
            ? 'Katılımını tamamla'
            : step === 'payment'
              ? 'Katılım ücretini tamamla'
              : 'Hazırsın, görüşürüz!'}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {step === 'payment'
          ? 'Ödemeni güvenli şekilde tamamla, dekontunu yükle.'
          : step === 'success'
            ? 'Kaydın alındı. Etkinlik detaylarını profilinden takip edebilirsin.'
            : 'Etkinliği seç, detayları incele ve yerini ayır.'}
      </p>
      {step === 'payment' ? (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
              <FiCreditCard className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Katılım ücreti</p>
              <p className="mt-0.5 text-lg font-bold text-[#0E1548]">₺150,00</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-amber-200 bg-white px-3 py-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><FiUploadCloud className="h-3.5 w-3.5 text-amber-600" aria-hidden /> Dekont yükle</span>
            <span className="font-medium text-amber-700">Bekleniyor</span>
          </div>
        </div>
      ) : step === 'success' ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5">
          <FiCheckCircle className="h-7 w-7 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-bold text-emerald-900">Katılımın onaylandı</p>
            <p className="mt-0.5 text-xs text-emerald-700">Biletin ve etkinlik bilgilerin hazır.</p>
          </div>
        </div>
      ) : step === 'event' ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-16 bg-gradient-to-br from-[#dbeafe] via-[#eef4ff] to-white" />
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">Etkinlik detayları</p>
                <p className="mt-1 truncate text-sm font-bold text-[#0E1548]">{EVENT_NAME}</p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#2D6AF6]">Gezi</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Kampüste yeni insanlarla tanış, birlikte keyifli bir gün geçir ve öğrenci topluluğuna katıl.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><FiCalendar className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> 18 Mayıs, 14:00</span>
              <span className="inline-flex items-center gap-1.5"><FiMapPin className="h-3.5 w-3.5 text-[#2D6AF6]" aria-hidden /> Merkez kampüs</span>
            </div>
          </div>
        </div>
      ) : step === 'join' ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2D6AF6]">Katılım özeti</p>
              <p className="mt-1 truncate text-sm font-bold text-[#0E1548]">{EVENT_NAME}</p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Uygun</span>
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-500">
            <span className="flex items-center justify-between"><span>Katılımcı</span><strong className="font-semibold text-slate-700">Ayşe Yılmaz</strong></span>
            <span className="flex items-center justify-between"><span>Kontenjan</span><strong className="font-semibold text-slate-700">24 kişilik yer</strong></span>
            <span className="flex items-center justify-between"><span>Ücret</span><strong className="font-semibold text-slate-700">₺150,00</strong></span>
          </div>
        </div>
      ) : null}
      <div className={`${btnPrimary} pointer-events-none mt-4 !w-full gap-2 ${step === 'payment' ? 'bg-amber-500' : ''} ${step === 'success' ? 'bg-emerald-600' : ''}`}>
        <span>
          {step === 'event' ? 'Etkinlik detayını gör' : step === 'join' ? 'Etkinliğe katıl' : step === 'payment' ? 'Ödemeyi tamamla' : 'Etkinlik biletini görüntüle'}
        </span>
      </div>
    </div>
  );
}

export function RegistrationPreview() {
  const [step, setStep] = useState<DemoStep>('event');

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    async function play() {
      while (!cancelled) {
        for (const nextStep of ['event', 'join', 'payment', 'success'] as DemoStep[]) {
          setStep(nextStep);
          await wait(nextStep === 'payment' ? 4500 : 3500);
          if (cancelled) return;
        }
      }
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mx-auto hidden w-full max-w-sm" aria-hidden>
        <div className="rounded-[2rem] border-[10px] border-[#0E1548] bg-[#0E1548] shadow-xl shadow-slate-900/15">
          <div className="overflow-hidden rounded-[1.25rem] bg-white">
            <div className="flex justify-center bg-white py-2">
              <span className="h-1.5 w-16 rounded-full bg-slate-200" />
            </div>
            <RegisterPreview compact step={step} />
          </div>
        </div>
      </div>

      <div className="hidden md:block" aria-hidden>
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
          <RegisterPreview step={step} />
        </div>
      </div>
    </>
  );
}
