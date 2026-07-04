import { createAdminClient } from '@/utils/supabase/admin';
import { applyContractPlaceholders, hashContractContent } from '@/lib/contract-templates';
import { formatFullName } from '@/lib/format';
import strings from '@json/src/lib/contract-service.json';
import { formatString } from '@/lib/strings/format';

export type PersonnelContract = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
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
  summary?: string | null;
  content_html: string;
  version: number;
  is_required: boolean;
  sort_order: number;
}): PersonnelContract {
  const contentHtml = applyContractPlaceholders(row.content_html);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? null,
    contentHtml,
    version: row.version,
    isRequired: row.is_required,
    sortOrder: row.sort_order,
  };
}

export async function listActiveContracts(): Promise<PersonnelContract[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('personnel_contracts')
    .select('id, slug, title, summary, content_html, version, is_required, sort_order')
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
      content_hash,
      email,
      full_name,
      accepted_at,
      personnel_contracts (
        slug,
        title,
        summary,
        content_html,
        version
      )
    `
    )
    .eq('access_token', token)
    .maybeSingle();

  const contract = unwrapJoin(
    (
      acceptance as {
        personnel_contracts?:
          | {
              slug: string;
              title: string;
              summary?: string | null;
              content_html: string;
              version: number;
            }
          | {
              slug: string;
              title: string;
              summary?: string | null;
              content_html: string;
              version: number;
            }[];
      } | null
    )?.personnel_contracts
  );

  if (error || !acceptance || !contract) return null;

  const contentHtml = applyContractPlaceholders(contract.content_html);

  return {
    slug: contract.slug,
    title: contract.title,
    summary: contract.summary ?? null,
    contentHtml,
    version: acceptance.contract_version,
    contentHash: (acceptance as { content_hash?: string | null }).content_hash ?? null,
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
      throw new Error(strings.requiredContractsMissing);
    }
  }

  const contractById = new Map(required.map((c) => [c.id, c]));
  for (const item of params.acceptances) {
    const contract = contractById.get(item.contractId);
    if (!contract) {
      throw new Error(strings.invalidAcceptance);
    }
    if (contract.version !== item.version) {
      throw new Error(formatString(strings.contractUpdated, { title: contract.title }));
    }
  }

  const fullName = formatFullName(params.firstName, params.lastName);
  const now = new Date().toISOString();
  const rows = params.acceptances.map((item) => {
    const contract = contractById.get(item.contractId)!;
    return {
      contract_id: item.contractId,
      contract_version: item.version,
      content_hash: hashContractContent(contract.slug, contract.version, contract.contentHtml),
      registration_request_id: params.registrationRequestId,
      email: params.email.trim().toLowerCase(),
      full_name: fullName,
      scroll_completed_at: now,
      user_agent: params.userAgent?.slice(0, 500) ?? null,
    };
  });

  await admin
    .from('personnel_contract_acceptances')
    .delete()
    .eq('registration_request_id', params.registrationRequestId);

  const { error } = await admin.from('personnel_contract_acceptances').insert(rows);

  if (error) throw new Error(formatString(strings.acceptancesSaveFailed, { message: error.message }));
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
      content_hash,
      accepted_at,
      personnel_contracts (slug, title, summary, content_html, version)
    `
    )
    .eq('employee_id', employeeId)
    .order('accepted_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const contract = unwrapJoin(
      row.personnel_contracts as
        | { slug: string; title: string; summary?: string | null; content_html: string; version: number }
        | { slug: string; title: string; summary?: string | null; content_html: string; version: number }[]
    );
    if (!contract) return [];
    return [
      {
        slug: contract.slug,
        title: contract.title,
        summary: contract.summary ?? null,
        contentHtml: applyContractPlaceholders(contract.content_html),
        version: row.contract_version,
        contentHash: (row as { content_hash?: string | null }).content_hash ?? null,
        acceptedAt: row.accepted_at,
        accessToken: row.access_token,
      },
    ];
  });
}
