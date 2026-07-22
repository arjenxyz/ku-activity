import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export type AdminProjectActor = {
  id: string;
  email: string | null;
};

async function claimOrphanProjectWithServiceRole(
  admin: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data: project } = await admin
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return false;
  if (project.created_by === userId) return true;
  if (project.created_by !== null) return false;

  const { data: claimed, error } = await admin
    .from('projects')
    .update({ created_by: userId })
    .eq('id', projectId)
    .is('created_by', null)
    .select('id')
    .maybeSingle();

  if (!error && claimed) return true;

  const { data: refreshed } = await admin
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle();

  return refreshed?.created_by === userId;
}

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

  const { data: claimed, error: claimError } = await supabase.rpc('claim_orphan_project', {
    p_project_id: projectId,
  });

  if (!claimError && claimed) {
    return { id: user.id, email: user.email ?? null };
  }

  if (claimError && !claimError.message.includes('claim_orphan_project')) {
    console.warn('claim_orphan_project:', claimError.message);
  }

  const { data: allowed, error: accessError } = await supabase.rpc('can_access_project', {
    p_project_id: projectId,
  });

  if (accessError || !allowed) {
    throw new Error('FORBIDDEN');
  }

  return { id: user.id, email: user.email ?? null };
}

/** Service role — service_role RLS bypass ettiği için sahiplik / ortak kontrolü */
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

  const owned = await claimOrphanProjectWithServiceRole(admin, projectId, userId);
  if (owned) return;

  const { data: collab } = await admin
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (collab) return;

  throw new Error('FORBIDDEN');
}
