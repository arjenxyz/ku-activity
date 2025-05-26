// src/types/adminTypes.ts

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  daily_wage: number;
  position: string;
  hire_date: string;
  total_days?: number;
  today_verified?: boolean;
  monthly_attendance?: number[];
};

export type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
};

export type WorkLog = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  date: string;
  amount: number;
  description: string | null;
};




export type Deduction = {
  id: string;
  employee_id: string;
  employee: { id: string; name: string } | null;
  date: string;
  type: string;
  amount: number;
  description: string | null;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
};

// ActionButton tipi (opsiyonel)
export type ActionButton = {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  color: string;
};