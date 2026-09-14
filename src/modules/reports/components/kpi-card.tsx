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
    <div className="rounded-md border px-3 py-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
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
    <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function ErrorBlock({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-4 text-sm text-destructive">
      {children}
    </p>
  );
}
