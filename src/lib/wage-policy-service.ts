import { createClient } from '@/utils/supabase/server';
import {
  DEFAULT_WAGE_POLICY,
  normalizeWagePolicy,
  type WagePolicy,
} from '@/types/wage-policy';
import {
  mergeWagePolicies,
  type ResolvedWagePolicy,
} from '@/lib/wage-policy-calc';

export type { ResolvedWagePolicy } from '@/lib/wage-policy-calc';
export {
  computeEligibleMinimumForPeriod,
  computeMinimumWageGapWithPolicy,
  getReferenceMinimumAmount,
  mergeWagePolicies,
} from '@/lib/wage-policy-calc';

export async function fetchCompanyWagePolicy(ownerId: string): Promise<WagePolicy | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('wage_policies')
    .select('policy')
    .eq('owner_id', ownerId)
    .is('project_id', null)
    .maybeSingle();

  if (!data?.policy) return null;
  return normalizeWagePolicy(data.policy);
}

export async function fetchProjectWagePolicyRow(projectId: string, ownerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('wage_policies')
    .select('policy, use_company_default')
    .eq('owner_id', ownerId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (!data) return null;
  return {
    policy: data.policy ? normalizeWagePolicy(data.policy) : null,
    useCompanyDefault: data.use_company_default !== false,
  };
}

export async function resolveWagePolicyForProject(
  projectId: string,
  ownerId: string
): Promise<ResolvedWagePolicy> {
  const [company, project] = await Promise.all([
    fetchCompanyWagePolicy(ownerId),
    fetchProjectWagePolicyRow(projectId, ownerId),
  ]);
  return mergeWagePolicies(company, project);
}

export async function upsertCompanyWagePolicy(ownerId: string, policy: WagePolicy) {
  const supabase = await createClient();
  const payload = {
    ...policy,
    configuredAt: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('wage_policies')
    .select('id')
    .eq('owner_id', ownerId)
    .is('project_id', null)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('wage_policies')
      .update({ policy: payload, use_company_default: true })
      .eq('id', existing.id)
      .select('policy')
      .single();
    if (error) throw migrationHint(error);
    return normalizeWagePolicy(data.policy);
  }

  const { data, error } = await supabase
    .from('wage_policies')
    .insert({
      owner_id: ownerId,
      project_id: null,
      use_company_default: true,
      policy: payload,
    })
    .select('policy')
    .single();

  if (error) throw migrationHint(error);
  return normalizeWagePolicy(data.policy);
}

export async function upsertProjectWagePolicy(
  projectId: string,
  ownerId: string,
  body: { useCompanyDefault: boolean; policy?: WagePolicy }
) {
  const supabase = await createClient();
  const policyPayload = body.useCompanyDefault
    ? {}
    : {
        ...(body.policy ?? DEFAULT_WAGE_POLICY),
        configuredAt: new Date().toISOString(),
      };

  const { data: existing } = await supabase
    .from('wage_policies')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('project_id', projectId)
    .maybeSingle();

  const row = {
    owner_id: ownerId,
    project_id: projectId,
    use_company_default: body.useCompanyDefault,
    policy: policyPayload,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('wage_policies')
      .update(row)
      .eq('id', existing.id)
      .select('policy, use_company_default')
      .single();
    if (error) throw migrationHint(error);
    return {
      policy: data.policy ? normalizeWagePolicy(data.policy) : null,
      useCompanyDefault: data.use_company_default !== false,
    };
  }

  const { data, error } = await supabase.from('wage_policies').insert(row).select('policy, use_company_default').single();
  if (error) throw migrationHint(error);

  return {
    policy: data.policy ? normalizeWagePolicy(data.policy) : null,
    useCompanyDefault: data.use_company_default !== false,
  };
}

function migrationHint(error: { message: string }) {
  if (error.message.includes('wage_policies')) {
    return new Error('036_wage_policies.sql migration çalıştırın');
  }
  return error;
}
