import { dashboardQuerySchema } from "@/modules/reports/schemas/reports.schemas";
import { firstSearchParam } from "@/modules/reports/lib/params";
import { getDashboardForTenant } from "@/modules/reports/services/dashboard.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { DashboardView } from "@/modules/reports/components/dashboard-view";
import { ErrorBlock } from "@/modules/reports/components/kpi-card";
import { requirePermission } from "@/shared/auth/session";
import { publicErrorMessage } from "@/shared/errors/public-error";
import {
  companyDisplayName,
  getCompanyShellData,
} from "@/modules/app-shell/loaders/company-shell";

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
    const [data, usage, company] = await Promise.all([
      getDashboardForTenant({
        companyId: user.companyId,
        role: user.role,
        query,
      }),
      getCompanyUsageSnapshot(user.companyId),
      getCompanyShellData(user.companyId),
    ]);
    return (
      <DashboardView
        data={data}
        usage={usage}
        companyName={companyDisplayName(company)}
      />
    );
  } catch (error) {
    const message =
      publicErrorMessage(error, "Não foi possível carregar o dashboard.");
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
