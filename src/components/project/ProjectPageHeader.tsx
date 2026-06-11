export function ProjectPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
  );
}
