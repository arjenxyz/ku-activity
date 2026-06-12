import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export type AdminProjectActor = {
  id: string;
  email: string | null;
};

/** Oturumlu yönetici — RLS + RPC ile proje erişimi */
export async function assertAdminProjectAccess(projectId: string): Promise<AdminProjectActor> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('UNAUTHORIZED');
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || !isAdmin) {
    throw new Error('UNAUTHORIZED');
  }

  const { data: allowed, error: accessError } = await supabase.rpc('can_access_project', {
    p_project_id: projectId,
  });

  if (accessError || !allowed) {
    throw new Error('FORBIDDEN');
  }

  return { id: user.id, email: user.email ?? null };
}

/** Service role — service_role RLS bypass ettiği için sahiplik kontrolü */
export async function assertAdminOwnsProject(
  admin: SupabaseClient,
  projectId: string,
  userId: string
): Promise<void> {
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'developer' || profile?.role === 'owner') {
    return;
  }

  const { data: project } = await admin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('created_by', userId)
    .maybeSingle();

  if (!project) {
    throw new Error('FORBIDDEN');
  }
}
