import { createAdminClient } from '@/utils/supabase/admin';
import { isProjectInClosure, type ClosurePhase } from '@/lib/closure-phase';

export class ProjectClosureWriteBlockedError extends Error {
  constructor() {
    super('PROJECT_IN_CLOSURE');
    this.name = 'ProjectClosureWriteBlockedError';
  }
}

export async function assertProjectWritable(projectId: string) {
  const admin = createAdminClient();
  const { data: project } = await admin
    .from('projects')
    .select('closure_phase')
    .eq('id', projectId)
    .maybeSingle();

  if (isProjectInClosure((project?.closure_phase ?? 'none') as ClosurePhase)) {
    throw new ProjectClosureWriteBlockedError();
  }
}

export async function assertPersonnelProjectWritable(projectId: string) {
  await assertProjectWritable(projectId);
}
