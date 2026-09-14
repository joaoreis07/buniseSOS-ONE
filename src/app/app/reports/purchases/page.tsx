import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { firstSearchParam } from "@/modules/reports/lib/params";
import { purchasesReportQuerySchema } from "@/modules/reports/schemas/reports.schemas";
import { getPurchasesReportForTenant } from "@/modules/reports/services/reports.service";
import { PurchasesReportFilters } from "@/modules/reports/components/report-filters";
import { PurchasesReportTable } from "@/modules/reports/components/purchases-report-table";
import {
  ExportCsvButton,
  ReportPagination,
} from "@/modules/reports/components/report-toolbar";
import { ErrorBlock } from "@/modules/reports/components/kpi-card";
import { PERIOD_PRESET_LABELS, formatCivilDate } from "@/modules/reports/lib/period";
import { Button } from "@/shared/ui/button";

export default async function PurchasesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("reports:view");
  const raw = await searchParams;
  const parsed = purchasesReportQuerySchema.safeParse({
    preset: firstSearchParam(raw, "preset") ?? "last_30",
    from: firstSearchParam(raw, "from"),
    to: firstSearchParam(raw, "to"),
    supplierId: firstSearchParam(raw, "supplierId"),
    productId: firstSearchParam(raw, "productId"),
    status: firstSearchParam(raw, "status"),
    page: firstSearchParam(raw, "page") ?? "1",
  });
  const query = parsed.success
    ? parsed.data
    : purchasesReportQuerySchema.parse({ page: 1 });

  try {
    const result = await getPurchasesReportForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    });
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Relatório de compras
            </h1>
            <p className="text-muted-foreground">
              {PERIOD_PRESET_LABELS[result.range.preset]} ·{" "}
              {formatCivilDate(result.range.start)} até{" "}
              {formatCivilDate(result.range.end)} · {result.total} item(ns)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/reports">Voltar</Link>
            </Button>
            <ExportCsvButton type="purchases" query={query} />
          </div>
        </div>
        <PurchasesReportFilters
          range={result.range}
          query={query}
          lookups={result.lookups}
        />
        <PurchasesReportTable items={result.items} />
        <ReportPagination
          href="/app/reports/purchases"
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
          Relatório de compras
        </h1>
        <ErrorBlock>{message}</ErrorBlock>
      </div>
    );
  }
}
