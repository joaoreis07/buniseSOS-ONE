import type { ReactNode } from "react";
import { cn } from "@/shared/utilities/cn";
import type { ChangeResult } from "@/modules/reports/lib/change";

export function KpiCard({
  label,
  value,
  hint,
  change,
}: {
  label: string;
  value: string | number;
  hint?: string;
  change?: ChangeResult | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {change ? (
          <span
            className={cn(
              "font-medium",
              change.direction === "up" && "text-emerald-700",
              change.direction === "down" && "text-destructive",
              change.direction === "flat" && "text-muted-foreground",
            )}
          >
            {change.label}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

export function EmptyBlock({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export function ErrorBlock({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-5 text-sm text-destructive">
      {children}
    </p>
  );
}
