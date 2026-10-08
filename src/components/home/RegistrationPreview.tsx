'use client';

import { useEffect, useState } from 'react';
import { btnPrimary, inputClass, labelClass } from '@/components/ui/styles';

const FULL_NAME = 'Ayşe Yılmaz';
const STUDENT_NO = '202100184';
const EVENT_NAME = 'Açık etkinlik';

type FocusField = 'name' | 'no' | 'event' | 'submit' | 'done';

function Field({
  label,
  value,
  active,
  placeholder,
}: {
  label: string;
  value: string;
  active: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div
        className={`${inputClass} min-h-[42px] ${active ? 'ring-2 ring-[#0E1548]/30' : ''} ${
          value ? 'text-slate-900' : 'text-slate-400'
        }`}
      >
        {value || placeholder}
        {active ? (
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-[#0E1548] align-middle" />
        ) : null}
      </div>
    </div>
  );
}

function RegisterPreview({
  compact = false,
  name,
  studentNo,
  eventName,
  focus,
}: {
  compact?: boolean;
  name: string;
  studentNo: string;
  eventName: string;
  focus: FocusField;
}) {
  const buttonLabel =
    focus === 'submit' ? 'Kaydediliyor…' : focus === 'done' ? 'Kayıt tamam' : 'Kaydı tamamla';

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
        <Field label="Ad soyad" value={name} active={focus === 'name'} placeholder="Ad soyad" />
        <Field label="Öğrenci no" value={studentNo} active={focus === 'no'} placeholder="Öğrenci no" />
      </div>
      <div className="mt-3">
        <Field label="Etkinlik" value={eventName} active={focus === 'event'} placeholder="Etkinlik seç" />
      </div>
      <div
        className={`${btnPrimary} pointer-events-none mt-4 !w-full ${focus === 'submit' ? 'opacity-80' : ''} ${
          focus === 'done' ? 'bg-[#152060]' : ''
        }`}
      >
        {buttonLabel}
      </div>
    </div>
  );
}

export function RegistrationPreview() {
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [eventName, setEventName] = useState('');
  const [focus, setFocus] = useState<FocusField>('name');

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      setName(FULL_NAME);
      setStudentNo(STUDENT_NO);
      setEventName(EVENT_NAME);
      setFocus('done');
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    async function typeInto(text: string, write: (value: string) => void, field: FocusField) {
      setFocus(field);
      for (let index = 1; index <= text.length; index += 1) {
        if (cancelled) return;
        write(text.slice(0, index));
        await wait(70);
      }
    }

    async function play() {
      while (!cancelled) {
        setName('');
        setStudentNo('');
        setEventName('');
        setFocus('name');
        await wait(500);
        if (cancelled) return;
        await typeInto(FULL_NAME, setName, 'name');
        await wait(280);
        if (cancelled) return;
        await typeInto(STUDENT_NO, setStudentNo, 'no');
        await wait(280);
        if (cancelled) return;
        await typeInto(EVENT_NAME, setEventName, 'event');
        await wait(350);
        if (cancelled) return;
        setFocus('submit');
        await wait(700);
        if (cancelled) return;
        setFocus('done');
        await wait(1800);
      }
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mx-auto hidden w-full max-w-sm sm:block lg:hidden" aria-hidden>
        <div className="rounded-[2rem] border-[10px] border-[#0E1548] bg-[#0E1548] shadow-xl shadow-slate-900/15">
          <div className="overflow-hidden rounded-[1.25rem] bg-white">
            <div className="flex justify-center bg-white py-2">
              <span className="h-1.5 w-16 rounded-full bg-slate-200" />
            </div>
            <RegisterPreview compact name={name} studentNo={studentNo} eventName={eventName} focus={focus} />
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
          <RegisterPreview name={name} studentNo={studentNo} eventName={eventName} focus={focus} />
        </div>
      </div>
    </>
  );
}
