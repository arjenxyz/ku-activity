import { createAdminClient } from '@/utils/supabase/admin';
import { formatFullName } from '@/lib/format';
import { sendPersonnelContractsEmail } from '@/lib/contract-email';

export type PersonnelContract = {
  id: string;
  slug: string;
  title: string;
  contentHtml: string;
  version: number;
  isRequired: boolean;
  sortOrder: number;
};

export type ContractAcceptanceInput = {
  contractId: string;
  version: number;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapContract(row: {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  version: number;
  is_required: boolean;
  sort_order: number;
}): PersonnelContract {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    contentHtml: row.content_html,
    version: row.version,
    isRequired: row.is_required,
    sortOrder: row.sort_order,
  };
}

export async function listActiveContracts(): Promise<PersonnelContract[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('personnel_contracts')
    .select('id, slug, title, content_html, version, is_required, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapContract);
}

export async function getContractByAccessToken(token: string) {
  const admin = createAdminClient();
  const { data: acceptance, error } = await admin
    .from('personnel_contract_acceptances')
    .select(
      `
      id,
      contract_version,
      email,
      full_name,
      accepted_at,
      personnel_contracts (
        slug,
        title,
        content_html,
        version
      )
    `
    )
    .eq('access_token', token)
    .maybeSingle();

  const contract = unwrapJoin(
    (acceptance as { personnel_contracts?: { slug: string; title: string; content_html: string; version: number } | { slug: string; title: string; content_html: string; version: number }[] } | null)
      ?.personnel_contracts
  );

  if (error || !acceptance || !contract) return null;

  return {
    slug: contract.slug,
    title: contract.title,
    contentHtml: contract.content_html,
    version: acceptance.contract_version,
    acceptedAt: acceptance.accepted_at,
    fullName: acceptance.full_name,
    email: acceptance.email,
  };
}

export async function recordContractAcceptances(params: {
  registrationRequestId: string;
  email: string;
  firstName: string;
  lastName: string;
  acceptances: ContractAcceptanceInput[];
  userAgent?: string | null;
}) {
  const admin = createAdminClient();
  const required = await listActiveContracts();
  const requiredIds = new Set(required.filter((c) => c.isRequired).map((c) => c.id));

  const acceptedIds = new Set(params.acceptances.map((a) => a.contractId));
  for (const id of requiredIds) {
    if (!acceptedIds.has(id)) {
      throw new Error('Tüm zorunlu sözleşmeleri okuyup onaylamanız gerekir');
    }
  }

  const contractById = new Map(required.map((c) => [c.id, c]));
  for (const item of params.acceptances) {
    const contract = contractById.get(item.contractId);
    if (!contract) {
      throw new Error('Geçersiz sözleşme onayı');
    }
    if (contract.version !== item.version) {
      throw new Error(
        `"${contract.title}" güncellendi. Sayfayı yenileyip sözleşmeleri tekrar okuyun.`
      );
    }
  }

  const fullName = formatFullName(params.firstName, params.lastName);
  const now = new Date().toISOString();
  const rows = params.acceptances.map((item) => ({
    contract_id: item.contractId,
    contract_version: item.version,
    registration_request_id: params.registrationRequestId,
    email: params.email.trim().toLowerCase(),
    full_name: fullName,
    scroll_completed_at: now,
    user_agent: params.userAgent?.slice(0, 500) ?? null,
  }));

  await admin
    .from('personnel_contract_acceptances')
    .delete()
    .eq('registration_request_id', params.registrationRequestId);

  const { error } = await admin.from('personnel_contract_acceptances').insert(rows);

  if (error) throw new Error('Sözleşme onayları kaydedilemedi: ' + error.message);

  await sendPersonnelContractsEmail({
    email: params.email.trim().toLowerCase(),
    fullName,
    registrationRequestId: params.registrationRequestId,
  });
}

export async function linkContractAcceptancesToEmployee(
  registrationRequestId: string,
  employeeId: string
) {
  const admin = createAdminClient();
  await admin
    .from('personnel_contract_acceptances')
    .update({ employee_id: employeeId })
    .eq('registration_request_id', registrationRequestId);
}

export async function listEmployeeContracts(employeeId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('personnel_contract_acceptances')
    .select(
      `
      access_token,
      contract_version,
      accepted_at,
      personnel_contracts (slug, title, content_html, version)
    `
    )
    .eq('employee_id', employeeId)
    .order('accepted_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const contract = unwrapJoin(row.personnel_contracts as { slug: string; title: string; content_html: string; version: number } | { slug: string; title: string; content_html: string; version: number }[]);
    if (!contract) return [];
    return [{
      slug: contract.slug,
      title: contract.title,
      contentHtml: contract.content_html,
      version: row.contract_version,
      acceptedAt: row.accepted_at,
      accessToken: row.access_token,
    }];
  });
}
