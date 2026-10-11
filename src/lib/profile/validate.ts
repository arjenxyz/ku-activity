import {
  classOptions,
  DEPARTMENT_CHOICES,
  OTHER_DEPARTMENT,
} from '@/lib/faculty';

export type ProfilePatchInput = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  department?: string;
  classYear?: string;
  phone?: string;
  otherDepartment?: string;
};

export type ValidatedProfilePatch = {
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  classYear: string;
  phone: string;
};

const PART_RE = /^[\p{L}'.-]{1,40}$/u;
const TR_MOBILE_RE = /^5\d{9}$/;

export function digitsOnlyPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 15);
}

/** Normalize TR numbers: 0555… / +90555… → 555… */
export function normalizeTrMobile(value: string) {
  let digits = digitsOnlyPhone(value);
  if (digits.startsWith('90') && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function splitFullName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

export function resolveDepartmentUi(stored: string | null | undefined): {
  department: string;
  otherDepartment: string;
} {
  const value = (stored || '').trim();
  if (!value) {
    return { department: DEPARTMENT_CHOICES[0]?.value ?? '', otherDepartment: '' };
  }
  const known = DEPARTMENT_CHOICES.some((item) => item.value === value);
  if (known && value !== OTHER_DEPARTMENT) {
    return { department: value, otherDepartment: '' };
  }
  if (value === OTHER_DEPARTMENT) {
    return { department: OTHER_DEPARTMENT, otherDepartment: '' };
  }
  return { department: OTHER_DEPARTMENT, otherDepartment: value };
}

export function validateProfilePatch(
  input: ProfilePatchInput
): { ok: true; data: ValidatedProfilePatch } | { ok: false; error: string; field?: string } {
  let firstName = (input.firstName ?? '').trim();
  let lastName = (input.lastName ?? '').trim();

  if (!firstName && !lastName && input.fullName) {
    const split = splitFullName(input.fullName);
    firstName = split.firstName;
    lastName = split.lastName;
  }

  if (!firstName) {
    return { ok: false, error: 'Ad gerekli', field: 'firstName' };
  }
  if (!PART_RE.test(firstName)) {
    return { ok: false, error: 'Ad geçersiz', field: 'firstName' };
  }
  if (!lastName) {
    return { ok: false, error: 'Soyad gerekli', field: 'lastName' };
  }
  if (!PART_RE.test(lastName.replace(/\s+/g, ''))) {
    // allow multi-word surnames with spaces
    if (!/^[\p{L}\s'.-]{1,60}$/u.test(lastName)) {
      return { ok: false, error: 'Soyad geçersiz', field: 'lastName' };
    }
  }

  const fullName = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();

  let department = (input.department ?? '').trim();
  if (!department) {
    return { ok: false, error: 'Bölüm seçin', field: 'department' };
  }
  if (department === OTHER_DEPARTMENT) {
    const other = (input.otherDepartment ?? '').trim().replace(/\s+/g, ' ');
    if (other.length < 2) {
      return { ok: false, error: 'Bölüm adını yazın', field: 'otherDepartment' };
    }
    if (other.length > 80) {
      return { ok: false, error: 'Bölüm adı çok uzun', field: 'otherDepartment' };
    }
    department = other;
  } else {
    const allowed = DEPARTMENT_CHOICES.some((item) => item.value === department);
    if (!allowed) {
      return { ok: false, error: 'Geçersiz bölüm', field: 'department' };
    }
  }

  const classYear = (input.classYear ?? '').trim();
  if (!classYear) {
    return { ok: false, error: 'Sınıf seçin', field: 'classYear' };
  }
  const deptForClass =
    (input.department ?? '').trim() === OTHER_DEPARTMENT
      ? OTHER_DEPARTMENT
      : (input.department ?? '').trim();
  const years = classOptions(deptForClass).map((item) => item.value);
  if (!years.includes(classYear)) {
    return { ok: false, error: 'Bu bölüm için geçersiz sınıf', field: 'classYear' };
  }

  const phone = normalizeTrMobile(input.phone ?? '');
  if (!phone) {
    return { ok: false, error: 'Telefon gerekli', field: 'phone' };
  }
  if (!TR_MOBILE_RE.test(phone)) {
    return {
      ok: false,
      error: 'Telefon 5 ile başlayan 10 haneli olmalı (05xx…)',
      field: 'phone',
    };
  }

  return {
    ok: true,
    data: { firstName, lastName, fullName, department, classYear, phone },
  };
}
