import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import type { AdminProjectActor } from '@/lib/project-access';
import { assertAdminProjectAccess } from '@/lib/project-access';

const CODE_PREFIX = 'ORTAK-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCollabCodeBody(length = 10) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return out;
}

export function generateProjectCollabCode() {
  return `${CODE_PREFIX}${generateCollabCodeBody(10)}`;
}

export function normalizeCollabCode(raw: string): string | null {
  const text = raw.trim().toUpperCase().replace(/\s+/g, '');
  const match = text.match(/ORTAK-[A-Z0-9]{8,14}/);
  return match ? match[0] : null;
}

export type ProjectMembership = 'owner' | 'collaborator' | 'platform';

export async function requireProjectOwner(projectId: string): Promise<AdminProjectActor> {
  const actor = await assertAdminProjectAccess(projectId);
  const supabase = await createClient();

  const { data: isPlatform } = await supabase.rpc('is_platform_admin');
  if (isPlatform) return actor;

  const { data: owns } = await supabase.rpc('owns_project', { p_project_id: projectId });
  if (!owns) throw new Error('OWNER_REQUIRED');

  return actor;
}

export async function resolveProjectMembership(
  admin: SupabaseClient,
  projectId: string,
  userId: string
): Promise<ProjectMembership> {
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'developer' || profile?.role === 'owner') {
    return 'platform';
  }

  const { data: project } = await admin
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle();

  if (project?.created_by === userId) return 'owner';

  const { data: collab } = await admin
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (collab) return 'collaborator';
  return 'owner';
}

export async function listProjectCollaborators(projectId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('project_collaborators')
    .select('id, user_id, role, joined_at, added_by, profiles:user_id(full_name)')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true });

  if (error) {
    if (error.message.includes('project_collaborators')) {
      throw new Error('MIGRATION_REQUIRED');
    }
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => {
      const profile = row.profiles as { full_name?: string | null } | null;
      let email: string | null = null;
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(row.user_id as string);
        email = authUser.user?.email ?? null;
      } catch {
        /* email optional */
      }
      return {
        id: row.id as string,
        userId: row.user_id as string,
        role: row.role as string,
        joinedAt: row.joined_at as string,
        fullName: profile?.full_name?.trim() || null,
        email,
      };
    })
  );
}

export async function getOrCreateCollabCode(projectId: string, createdBy: string) {
  const admin = createAdminClient();
  const { data: existing, error } = await admin
    .from('project_collab_codes')
    .select('code, rotated_at')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error && !error.message.includes('project_collab_codes')) {
    throw new Error(error.message);
  }
  if (error?.message.includes('project_collab_codes')) {
    throw new Error('MIGRATION_REQUIRED');
  }

  if (existing?.code) {
    return { code: existing.code as string, rotatedAt: existing.rotated_at as string };
  }

  return rotateCollabCode(projectId, createdBy);
}

export async function rotateCollabCode(projectId: string, createdBy: string) {
  const admin = createAdminClient();
  let code = generateProjectCollabCode();
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin
      .from('project_collab_codes')
      .upsert(
        {
          project_id: projectId,
          code,
          created_by: createdBy,
          rotated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id' }
      )
      .select('code, rotated_at')
      .single();

    if (!error && data) {
      return { code: data.code as string, rotatedAt: data.rotated_at as string };
    }
    if (error?.code === '23505') {
      code = generateProjectCollabCode();
      continue;
    }
    if (error?.message.includes('project_collab_codes')) {
      throw new Error('MIGRATION_REQUIRED');
    }
    throw new Error(error?.message ?? 'Kod oluşturulamadı');
  }
  throw new Error('Kod oluşturulamadı');
}

export async function joinProjectWithCollabCode(params: {
  userId: string;
  code: string;
}) {
  const normalized = normalizeCollabCode(params.code);
  if (!normalized) throw new Error('INVALID_CODE');

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('project_collab_codes')
    .select('project_id, code')
    .eq('code', normalized)
    .maybeSingle();

  if (error?.message.includes('project_collab_codes')) {
    throw new Error('MIGRATION_REQUIRED');
  }
  if (error) throw new Error(error.message);
  if (!row) throw new Error('CODE_NOT_FOUND');

  const projectId = row.project_id as string;

  const { data: project } = await admin
    .from('projects')
    .select('id, name, created_by')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) throw new Error('PROJECT_NOT_FOUND');
  if (project.created_by === params.userId) throw new Error('ALREADY_OWNER');

  const { data: existing } = await admin
    .from('project_collaborators')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (existing) throw new Error('ALREADY_COLLABORATOR');

  const { error: insertError } = await admin.from('project_collaborators').insert({
    project_id: projectId,
    user_id: params.userId,
    role: 'ops',
    added_by: project.created_by,
  });

  if (insertError) {
    if (insertError.code === '23505') throw new Error('ALREADY_COLLABORATOR');
    if (insertError.message.includes('project_collaborators')) {
      throw new Error('MIGRATION_REQUIRED');
    }
    throw new Error(insertError.message);
  }

  return {
    projectId,
    projectName: project.name as string,
  };
}

export async function removeProjectCollaborator(projectId: string, userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('project_collaborators')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    if (error.message.includes('project_collaborators')) {
      throw new Error('MIGRATION_REQUIRED');
    }
    throw new Error(error.message);
  }
}

export async function leaveProjectAsCollaborator(projectId: string, userId: string) {
  return removeProjectCollaborator(projectId, userId);
}

/** Liste için: kullanıcıya göre membership rozeti */
export async function attachMembershipToProjects<T extends { id: string; created_by?: string | null }>(
  projects: T[],
  userId: string
): Promise<Array<T & { membership: 'owner' | 'collaborator' }>> {
  if (projects.length === 0) return [];

  const admin = createAdminClient();
  const { data: collabs, error } = await admin
    .from('project_collaborators')
    .select('project_id')
    .eq('user_id', userId)
    .in(
      'project_id',
      projects.map((p) => p.id)
    );

  const collabSet = new Set(
    error?.message.includes('project_collaborators')
      ? []
      : (collabs ?? []).map((c) => c.project_id as string)
  );

  return projects.map((p) => ({
    ...p,
    membership:
      p.created_by === userId
        ? ('owner' as const)
        : collabSet.has(p.id)
          ? ('collaborator' as const)
          : ('owner' as const),
  }));
}
