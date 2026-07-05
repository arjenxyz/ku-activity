import { createAdminClient } from '@/utils/supabase/admin';

export const ADMIN_OPERATIONAL_PROJECT_LIMIT = 2;

export type AdminProjectQuota = {
  operationalCount: number;
  limit: number | null;
  canCreate: boolean;
};

export async function getAdminProjectQuota(userId: string): Promise<AdminProjectQuota> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_admin_project_quota', {
    p_user_id: userId,
  });

  if (error || !data) {
    const { count } = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .or('closure_phase.is.null,closure_phase.eq.none');

    const operationalCount = count ?? 0;
    return {
      operationalCount,
      limit: ADMIN_OPERATIONAL_PROJECT_LIMIT,
      canCreate: operationalCount < ADMIN_OPERATIONAL_PROJECT_LIMIT,
    };
  }

  const row = data as {
    operationalCount?: number;
    limit?: number | null;
    canCreate?: boolean;
  };

  return {
    operationalCount: Number(row.operationalCount ?? 0),
    limit: row.limit == null ? null : Number(row.limit),
    canCreate: Boolean(row.canCreate),
  };
}
