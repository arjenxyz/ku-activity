const FORM_KEY = 'crewledger-registration-form-draft';
const DB_NAME = 'crewledger-registration';
const PHOTO_KEY = 'selfie';

export type RegistrationFormDraft = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tc_kimlik: string;
  birth_date: string;
  iban: string;
  pin: string;
  pin_confirm: string;
};

export type RegistrationFormDraftPayload = {
  form: RegistrationFormDraft;
  contractAcceptances: Array<{ contractId: string; version: number }>;
  savedAt: string;
};

const EMPTY_FORM: RegistrationFormDraft = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  tc_kimlik: '',
  birth_date: '',
  iban: '',
  pin: '',
  pin_confirm: '',
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('blobs')) {
        req.result.createObjectStore('blobs');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

export function loadRegistrationFormDraft(): RegistrationFormDraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationFormDraftPayload;
    if (!parsed?.form || !Array.isArray(parsed.contractAcceptances)) return null;
    return {
      form: { ...EMPTY_FORM, ...parsed.form },
      contractAcceptances: parsed.contractAcceptances,
      savedAt: parsed.savedAt ?? '',
    };
  } catch {
    return null;
  }
}

export function saveRegistrationFormDraft(payload: {
  form: RegistrationFormDraft;
  contractAcceptances: Array<{ contractId: string; version: number }>;
}) {
  if (typeof window === 'undefined') return;
  try {
    const data: RegistrationFormDraftPayload = {
      form: payload.form,
      contractAcceptances: payload.contractAcceptances,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export async function saveRegistrationDraftPhoto(file: File): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put(file, PHOTO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* */
  }
}

export async function loadRegistrationDraftPhoto(): Promise<File | null> {
  try {
    const db = await openDb();
    const file = await new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction('blobs', 'readonly');
      const req = tx.objectStore('blobs').get(PHOTO_KEY);
      req.onsuccess = () => resolve((req.result as File) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return file;
  } catch {
    return null;
  }
}

export async function clearRegistrationFormDraft() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(FORM_KEY);
    } catch {
      /* */
    }
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').delete(PHOTO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* */
  }
}

export function hasRegistrationFormDraft(): boolean {
  return Boolean(loadRegistrationFormDraft());
}
