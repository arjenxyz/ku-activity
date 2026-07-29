/** Tarayıcı konsol / runtime hatalarını kısa buffer'da tutar (bug-report için). */

const MAX_ENTRIES = 12;
const MAX_LEN = 280;

const buffer: string[] = [];
let installed = false;

function push(entry: string) {
  const cleaned = entry.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
  if (!cleaned) return;
  if (buffer[buffer.length - 1] === cleaned) return;
  buffer.push(cleaned);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

function serializeArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export function installSupportConsoleBuffer() {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  window.addEventListener('error', (event) => {
    push(`error: ${event.message}${event.filename ? ` @ ${event.filename}:${event.lineno}` : ''}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    push(`unhandledrejection: ${serializeArg(event.reason)}`);
  });

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    push(`console.error: ${args.map(serializeArg).join(' ')}`);
    originalError(...args);
  };
}

export function getRecentBrowserErrors(): string[] {
  return [...buffer];
}

export function formatBrowserErrorsForReport(errors: string[]): string {
  if (!errors.length) return 'Browser errors: (none captured)';
  return ['Browser errors:', ...errors.map((item, index) => `${index + 1}. ${item}`)].join('\n');
}
