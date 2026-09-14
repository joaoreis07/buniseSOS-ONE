import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { firstSearchParam } from "@/modules/reports/lib/params";
import { inventoryReportQuerySchema } from "@/modules/reports/schemas/reports.schemas";
import { getInventoryReportForTenant } from "@/modules/reports/services/reports.service";
import { InventoryReportFilters } from "@/modules/reports/components/report-filters";
import { InventoryReportTable } from "@/modules/reports/components/inventory-report-table";
import {
  ExportCsvButton,
  ReportPagination,
} from "@/modules/reports/components/report-toolbar";
import { ErrorBlock } from "@/modules/reports/components/kpi-card";
import { Button } from "@/shared/ui/button";

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("reports:view");
  const raw = await searchParams;
  const parsed = inventoryReportQuerySchema.safeParse({
    q: firstSearchParam(raw, "q"),
    stock: firstSearchParam(raw, "stock"),
    page: firstSearchParam(raw, "page") ?? "1",
  });
  const query = parsed.success
    ? parsed.data
    : inventoryReportQuerySchema.parse({ page: 1 });

  try {
    const result = await getInventoryReportForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    });
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Relatório de estoque
            </h1>
            <p className="text-muted-foreground">
              Snapshot atual · {result.total} produto(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/reports">Voltar</Link>
            </Button>
            <ExportCsvButton type="inventory" query={query} />
          </div>
        </div>
        <InventoryReportFilters query={query} />
        <InventoryReportTable items={result.items} />
        <ReportPagination
          href="/app/reports/inventory"
          query={query}
          page={result.page}
          pageCount={result.pageCount}
        />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível carregar o relatório.";
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Relatório de estoque
        </h1>
        <ErrorBlock>{message}</ErrorBlock>
      </div>
    );
  }
}
