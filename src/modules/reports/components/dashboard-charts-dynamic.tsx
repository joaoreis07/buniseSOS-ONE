"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 ${className ?? "h-[220px]"}`}
      aria-hidden
    />
  );
}

export const RevenueExpenseChart = dynamic(
  () =>
    import("@/modules/reports/components/dashboard-charts").then(
      (mod) => mod.RevenueExpenseChart,
    ),
  { loading: () => <ChartSkeleton /> },
);

export const SalesBarChart = dynamic(
  () =>
    import("@/modules/reports/components/dashboard-charts").then(
      (mod) => mod.SalesBarChart,
    ),
  { loading: () => <ChartSkeleton /> },
);

export const CategoryPieChart = dynamic(
  () =>
    import("@/modules/reports/components/dashboard-charts").then(
      (mod) => mod.CategoryPieChart,
    ),
  { loading: () => <ChartSkeleton className="h-[240px]" /> },
);

export const CrmFunnelChart = dynamic(
  () =>
    import("@/modules/reports/components/dashboard-charts").then(
      (mod) => mod.CrmFunnelChart,
    ),
  { loading: () => <ChartSkeleton className="h-[200px]" /> },
);
