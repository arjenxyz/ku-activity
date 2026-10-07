import { createClient } from '@/utils/supabase/server';
import { isAppRole, type AppRole } from '@/lib/auth/roles';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  student_no: string | null;
  department: string | null;
  class_year: string | null;
  role: AppRole;
  is_active: boolean;
};

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, student_no, department, class_year, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data || !isAppRole(data.role)) return null;
  if (!data.is_active) return null;

  return data as Profile;
}
