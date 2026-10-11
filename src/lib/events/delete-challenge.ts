type Challenge = {
  code: string;
  expiresAt: number;
};

function bucket() {
  const g = globalThis as typeof globalThis & {
    __emsEventDeleteChallenges?: Map<string, Challenge>;
  };
  if (!g.__emsEventDeleteChallenges) {
    g.__emsEventDeleteChallenges = new Map();
  }
  return g.__emsEventDeleteChallenges;
}

function randomSixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function issueDeleteChallenge(eventId: string) {
  const code = randomSixDigit();
  bucket().set(eventId, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  return code;
}

export function consumeDeleteChallenge(eventId: string, code: string) {
  const row = bucket().get(eventId);
  if (!row) return false;
  if (Date.now() > row.expiresAt) {
    bucket().delete(eventId);
    return false;
  }
  if (row.code !== code.trim()) return false;
  bucket().delete(eventId);
  return true;
}
