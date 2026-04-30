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
    <article className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:shadow-cyan-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Decorative top glow if positive */}
      {positive && (
        <div className="absolute -top-[1px] left-8 h-[2px] w-12 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
      )}

      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium tracking-wide text-zinc-500 uppercase">{title}</p>
          <p className={cn("mt-3 text-3xl font-bold tracking-tight", positive ? "text-white" : "text-zinc-100")}>
            {value}
          </p>
        </div>
        {helper && (
          <div className="flex items-center gap-2 mt-auto">
            {positive && <svg className="h-4 w-4 text-cyan-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            <p className="text-xs font-medium text-zinc-500">{helper}</p>
          </div>
        )}
      </div>
    </article>
  );
}
