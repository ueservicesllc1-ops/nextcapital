import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  helper,
  positive,
}: {
  title: string;
  value: string;
  helper?: string;
  positive?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={cn("mt-2 text-2xl font-semibold text-white", positive && "text-emerald-400")}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </article>
  );
}
