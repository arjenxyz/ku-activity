// src/app/lib/proje/types.ts
export type Project = {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  description: string | null;
  status: 'active' | 'completed' | 'planned' | 'archived';
  onEdit: (id: string) => void;
  onDelete: () => Promise<void>;
};

export type ProjectFormData = {
  name: string;
  location?: string;
  start_date: string;
  description?: string;
  status: 'active' | 'planned' | 'completed' | 'archived';
};
