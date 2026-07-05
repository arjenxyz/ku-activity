export type ClosurePhase = 'none' | 'pending_consents' | 'export_window' | 'purged';

export const ACTIVE_CLOSURE_PHASES = new Set<ClosurePhase>(['pending_consents', 'export_window']);

export function isProjectInClosure(phase: string | null | undefined): boolean {
  return ACTIVE_CLOSURE_PHASES.has((phase ?? 'none') as ClosurePhase);
}

export type ClosureCountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function getClosureCountdown(deadlineAt: string | null, nowMs = Date.now()): ClosureCountdownParts | null {
  if (!deadlineAt) return null;
  const totalMs = new Date(deadlineAt).getTime() - nowMs;
  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const seconds = Math.floor(totalMs / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { totalMs, days, hours, minutes, seconds: secs, expired: false };
}
