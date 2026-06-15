export function jobNameFromJoin(
  row: { project_jobs?: { name: string } | { name: string }[] | null }
): string {
  const job = row.project_jobs;
  if (!job) return '—';
  if (Array.isArray(job)) return job[0]?.name ?? '—';
  return job.name ?? '—';
}
