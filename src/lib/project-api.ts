import type { ProjectProfitOverview } from '@/types/project-job';

async function parseError(res: Response) {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error || res.statusText;
}

export type ProjectEmployee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  daily_wage: number;
  is_active: boolean;
  hire_date: string | null;
  project_id?: string;
  photo_url?: string | null;
};

export async function fetchProjectEmployees(projectId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/employees`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.employees ?? []) as ProjectEmployee[];
}

export async function uploadEmployeePhoto(projectId: string, employeeId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/admin/projects/${projectId}/employees/${employeeId}/photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.photoUrl as string;
}

export async function deleteEmployeePhoto(projectId: string, employeeId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/employees/${employeeId}/photo`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchProjectSummary(projectId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/summary`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postWorkLog(
  projectId: string,
  body: {
    employeeId: string;
    date: string;
    amount: number;
    description?: string;
    mesaiType?: 'none' | 'ceyrek' | 'yarim' | 'tam';
    jobId?: string | null;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/work-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postDeduction(
  projectId: string,
  body: {
    employeeId: string;
    date: string;
    type: string;
    amount: number;
    description?: string;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/deductions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postMinimumWage(
  projectId: string,
  body: { employeeId: string; date: string; amount: number; description?: string }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/minimum-wages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchRecords(
  projectId: string,
  type: 'work-logs' | 'deductions' | 'minimum-wages',
  params?: { employeeId?: string; month?: string; approved?: string; deductionType?: string; disputed?: string }
) {
  const q = new URLSearchParams();
  if (params?.employeeId) q.set('employeeId', params.employeeId);
  if (params?.month) q.set('month', params.month);
  if (params?.approved) q.set('approved', params.approved);
  if (params?.deductionType) q.set('deductionType', params.deductionType);
  if (params?.disputed) q.set('disputed', params.disputed);

  const res = await fetch(`/api/admin/projects/${projectId}/${type}?${q}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function resetEmployeePin(projectId: string, employeeId: string, pin: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/employees/${employeeId}/reset-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function generatePayroll(projectId: string, month: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/payroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchPayroll(projectId: string, month?: string) {
  const q = month ? `?month=${month}` : '';
  const res = await fetch(`/api/admin/projects/${projectId}/payroll${q}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export type ProjectRecordType = 'work-logs' | 'deductions' | 'minimum-wages';

export async function updateProjectRecord(
  projectId: string,
  type: ProjectRecordType,
  recordId: string,
  body: {
    date?: string;
    amount?: number;
    description?: string | null;
    approved?: boolean;
    type?: string;
    mesaiType?: 'none' | 'ceyrek' | 'yarim' | 'tam';
    resolveDispute?: boolean;
    reconfirmAdmin?: boolean;
    jobId?: string | null;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/${type}/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteProjectRecord(
  projectId: string,
  type: ProjectRecordType,
  recordId: string
) {
  const res = await fetch(`/api/admin/projects/${projectId}/${type}/${recordId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function fetchEmployee(projectId: string, employeeId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/employees/${employeeId}`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.employee as ProjectEmployee;
}

export async function updateEmployee(
  projectId: string,
  employeeId: string,
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    position?: string;
    dailyWage?: number;
    hireDate?: string | null;
    isActive?: boolean;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/employees/${employeeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.employee as ProjectEmployee;
}

export async function fetchProjectProfit(projectId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/profit`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ProjectProfitOverview>;
}

export async function updateProfitShareCount(projectId: string, shareCount: number) {
  const res = await fetch(`/api/admin/projects/${projectId}/profit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shareCount }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ overview: ProjectProfitOverview }>;
}

export async function createProjectJob(
  projectId: string,
  body: {
    name: string;
    unitLabel?: string;
    unitPrice: number;
    quantity: number;
    notes?: string;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ overview: ProjectProfitOverview }>;
}

export async function updateProjectJob(
  projectId: string,
  jobId: string,
  body: {
    name?: string;
    unitLabel?: string;
    unitPrice?: number;
    quantity?: number;
    status?: 'active' | 'completed';
    notes?: string | null;
  }
) {
  const res = await fetch(`/api/admin/projects/${projectId}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ overview: ProjectProfitOverview }>;
}

export async function deleteProjectJob(projectId: string, jobId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ overview: ProjectProfitOverview }>;
}

export async function fetchProjectJobs(projectId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/jobs`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.jobs ?? []) as Array<{ id: string; name: string; status: string }>;
}

export async function addProjectPartner(projectId: string, name: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteProjectPartner(projectId: string, partnerId: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/partners/${partnerId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseError(res));
}
