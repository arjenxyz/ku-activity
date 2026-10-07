export type AppRole = 'student' | 'staff' | 'admin';

export type EventStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'completed'
  | 'archived';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  student_no: string | null;
  department: string | null;
  class_year: string | null;
  role: AppRole;
  is_active: boolean;
};

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  capacity: number | null;
  registration_deadline: string | null;
  status: EventStatus;
};

export type EventRegistrationRow = {
  id: string;
  event_id: string;
  profile_id: string;
  registration_no: string;
  logistics: Record<string, unknown>;
  /** Never expose raw token; DB column is checkin_token_hash only */
  registered_at: string;
};

export type EventAttendanceRow = {
  id: string;
  registration_id: string;
  event_day_id: string | null;
  checked_in_by: string | null;
  checked_in_at: string;
};
