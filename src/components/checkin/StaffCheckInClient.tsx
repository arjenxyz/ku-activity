'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildCameraConstraint,
  buildScanConfig,
  createQrScanner,
  pickCameraConfigs,
} from '@/lib/qr-scanner';
import { inputClass, labelClass, primaryButtonClass } from '@/components/auth/authStyles';
import { cardClass } from '@/components/ui/styles';

type CatalogLite = {
  id: string;
  title: string;
  assignedToStaff: boolean;
  days: Array<{ id: string; label: string; date: string }>;
};

type Result = {
  ok: boolean;
  duplicate?: boolean;
  message?: string;
  registrationNo?: string;
  name?: string;
  eventTitle?: string;
  dayLabel?: string | null;
  error?: string;
};

export function StaffCheckInClient({
  staffOnlyAssigned,
  lockedEventId,
}: {
  staffOnlyAssigned?: boolean;
  lockedEventId?: string;
}) {
  const [events, setEvents] = useState<CatalogLite[]>([]);
  const [eventId, setEventId] = useState(lockedEventId ?? '');
  const [dayId, setDayId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const scannerRef = useRef<ReturnType<typeof createQrScanner> | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/events');
      const payload = (await response.json().catch(() => null)) as { events?: CatalogLite[] } | null;
      let rows = (payload?.events ?? []).filter((item) =>
        staffOnlyAssigned ? item.assignedToStaff : true
      );
      if (lockedEventId) {
        rows = rows.filter((item) => item.id === lockedEventId);
      }
      setEvents(rows);
      const initial = lockedEventId || rows[0]?.id || '';
      setEventId(initial);
      const first = rows.find((item) => item.id === initial) ?? rows[0];
      setDayId(first?.days[0]?.id || '');
    })();
  }, [staffOnlyAssigned, lockedEventId]);

  const event = events.find((item) => item.id === eventId) ?? events[0];

  useEffect(() => {
    if (!event) return;
    if (lockedEventId && event.id !== lockedEventId) return;
    setDayId(event.days[0]?.id ?? '');
  }, [eventId, event, lockedEventId]);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, []);

  async function submitToken(token: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, eventId, dayId: dayId || null }),
      });
      const payload = (await response.json().catch(() => null)) as Result | null;
      if (!response.ok) {
        setResult(null);
        setError(payload?.error ?? 'Check-in başarısız');
        return;
      }
      setResult(payload);
    } finally {
      busyRef.current = false;
    }
  }

  async function startScan() {
    setError(null);
    setResult(null);
    setScanning(true);
    try {
      const scanner = createQrScanner('staff-checkin-reader');
      scannerRef.current = scanner;
      const cameras = await pickCameraConfigs();
      let started = false;
      for (const camera of cameras) {
        try {
          await scanner.start(
            buildCameraConstraint(camera, false),
            buildScanConfig(false, 'embedded'),
            (decoded) => {
              void submitToken(decoded.trim());
            },
            () => undefined
          );
          started = true;
          break;
        } catch {
          /* try next camera */
        }
      }
      if (!started) throw new Error('no camera');
    } catch {
      setScanning(false);
      setError('Kamera açılamadı. Tokeni elle girebilirsin.');
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop().catch(() => undefined);
    scannerRef.current = null;
    setScanning(false);
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClass} space-y-3 p-4`}>
        {lockedEventId ? (
          <p className="text-sm font-medium text-[#0E1548]">
            {event?.title ?? 'Etkinlik'}
          </p>
        ) : (
          <div>
            <label htmlFor="event" className={labelClass}>
              Etkinlik
            </label>
            <select
              id="event"
              className={inputClass}
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              {events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {event?.days.length ? (
          <div>
            <label htmlFor="day" className={labelClass}>
              Gün
            </label>
            <select
              id="day"
              className={inputClass}
              value={dayId}
              onChange={(e) => setDayId(e.target.value)}
            >
              {event.days.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.label} · {day.date}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className={`${cardClass} p-4`}>
        <div id="staff-checkin-reader" className="overflow-hidden rounded-2xl" />
        <div className="mt-3 flex flex-wrap gap-2">
          {!scanning ? (
            <button type="button" className={primaryButtonClass} onClick={() => void startScan()}>
              Kamerayı aç
            </button>
          ) : (
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#0E1548]"
              onClick={() => void stopScan()}
            >
              Kamerayı kapat
            </button>
          )}
        </div>
      </div>

      <form
        className={`${cardClass} space-y-3 p-4`}
        onSubmit={(e) => {
          e.preventDefault();
          void submitToken(manualToken.trim());
        }}
      >
        <label htmlFor="token" className={labelClass}>Elle token</label>
        <input
          id="token"
          className={inputClass}
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="QR içeriğini yapıştır"
        />
        <button type="submit" className={primaryButtonClass}>
          Check-in yap
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {result?.ok ? (
        <div className={`${cardClass} p-4 ${result.duplicate ? 'ring-1 ring-amber-300' : 'ring-1 ring-emerald-300'}`}>
          <p className="font-semibold text-[#0E1548]">{result.message}</p>
          <p className="mt-2 text-sm text-slate-700">
            {result.name} · {result.registrationNo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {result.eventTitle}
            {result.dayLabel ? ` · ${result.dayLabel}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}
