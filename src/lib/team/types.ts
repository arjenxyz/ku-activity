export type TeamApplicationStatus = 'pending' | 'accepted' | 'rejected';

export type TeamOpening = {
  id: string;
  title: string;
  description: string | null;
  isOpen: boolean;
  createdAt: string;
};

export type TeamApplication = {
  id: string;
  openingId: string;
  profileId: string;
  fullName: string;
  email: string;
  note: string | null;
  status: TeamApplicationStatus;
  createdAt: string;
};

export type TeamCounts = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

export const TEAM_STATUS_LABELS: Record<TeamApplicationStatus, string> = {
  pending: 'Bekliyor',
  accepted: 'Kabul',
  rejected: 'Red',
};

export function teamStatusTone(status: TeamApplicationStatus) {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-50 text-emerald-800';
    case 'rejected':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-amber-50 text-amber-800';
  }
}

export function countsFor(apps: TeamApplication[]): TeamCounts {
  return {
    total: apps.length,
    pending: apps.filter((a) => a.status === 'pending').length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  };
}
