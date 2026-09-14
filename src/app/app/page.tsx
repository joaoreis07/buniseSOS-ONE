import { dashboardQuerySchema } from "@/modules/reports/schemas/reports.schemas";
import { firstSearchParam } from "@/modules/reports/lib/params";
import { getDashboardForTenant } from "@/modules/reports/services/dashboard.service";
import { canViewReports } from "@/modules/reports/services/reports.service";
import { DashboardView } from "@/modules/reports/components/dashboard-view";
import { ErrorBlock } from "@/modules/reports/components/kpi-card";
import { requirePermission } from "@/shared/auth/session";

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("dashboard:view");
  const raw = await searchParams;
  const parsed = dashboardQuerySchema.safeParse({
    preset: firstSearchParam(raw, "preset") ?? "last_30",
    from: firstSearchParam(raw, "from"),
    to: firstSearchParam(raw, "to"),
  });
  const query = parsed.success
    ? parsed.data
    : dashboardQuerySchema.parse({ preset: "last_30" });

  try {
    const data = await getDashboardForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    });
    return (
      <DashboardView data={data} canViewReports={canViewReports(user.role)} />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar o dashboard.";
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão gerencial do período</p>
        </div>
        <ErrorBlock>{message}</ErrorBlock>
      </div>
    );
  }
}
