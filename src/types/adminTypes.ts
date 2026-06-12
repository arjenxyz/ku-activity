// src/types/adminTypes.ts

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  daily_wage: number;
  position: string;
  hire_date: string;
  project_id: string;
  photo_url?: string | null;
  total_days?: number;
  today_verified?: boolean;
  today_attendance_status?: 'confirmed' | 'pending_employee' | 'pending_admin' | 'none';
  monthly_attendance?: number[];
};

export type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
};

export interface Attendance {
  id: string;
  employee_id: string;
  project_id: string;
  date: string; // YYYY-MM-DD formatında
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at: string;
};

// YENİ TİP: Günlük Yevmiye Onayı
export interface DailyWage {
  id: string;
  employee_id: string;
  project_id: string;
  date: string; // YYYY-MM-DD formatında
  amount: number; // Girilen yevmiye miktarı (1, 0.5, 1.5 vb.)
  created_at: string;
  updated_at: string;
};


export type Deduction = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  project_id: string;
  date: string;
  type: string;
  amount: number;
  description: string | null;
   reason: string;
  created_at: string;
};

export type WorkLog = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  date: string;
  amount: number;
  description: string | null;
};


export type { Project } from '@/types/project';

// ActionButton tipi (opsiyonel)
export type ActionButton = {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  color: string;
};
