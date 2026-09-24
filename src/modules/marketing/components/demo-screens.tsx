"use client";

import dynamic from "next/dynamic";
import type { DemoModuleId } from "@/modules/marketing/demo-nav";

const DemoDashboardScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-dashboard-screen").then(
      (mod) => mod.DemoDashboardScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoSalesScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-sales-screen").then(
      (mod) => mod.DemoSalesScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoInventoryScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-inventory-screen").then(
      (mod) => mod.DemoInventoryScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoFinanceScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-finance-screen").then(
      (mod) => mod.DemoFinanceScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoPurchasesScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-purchases-screen").then(
      (mod) => mod.DemoPurchasesScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoSuppliersScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-suppliers-screen").then(
      (mod) => mod.DemoSuppliersScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

const DemoReportsScreen = dynamic(
  () =>
    import("@/modules/marketing/components/demo-reports-screen").then(
      (mod) => mod.DemoReportsScreen,
    ),
  { loading: () => <DemoScreenSkeleton /> },
);

function DemoScreenSkeleton() {
  return (
    <div className="space-y-4 p-1" aria-busy aria-label="Carregando demonstração">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export function DemoScreen({ module }: { module: DemoModuleId }) {
  switch (module) {
    case "crm":
    case "settings":
    case "products":
    case "communications":
      return null;
    case "dashboard":
      return <DemoDashboardScreen />;
    case "sales":
      return <DemoSalesScreen />;
    case "inventory":
      return <DemoInventoryScreen />;
    case "finance":
      return <DemoFinanceScreen />;
    case "purchases":
      return <DemoPurchasesScreen />;
    case "suppliers":
      return <DemoSuppliersScreen />;
    case "reports":
      return <DemoReportsScreen />;
  }
}
