export function ProjectPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 max-w-full rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04] sm:px-5">
      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0E1548]">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
