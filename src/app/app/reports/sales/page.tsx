import { requirePermission } from "@/shared/auth/session";
import { firstSearchParam } from "@/modules/reports/lib/params";
import { salesReportQuerySchema } from "@/modules/reports/schemas/reports.schemas";
import { getSalesReportForTenant } from "@/modules/reports/services/reports.service";
import { SalesReportFilters } from "@/modules/reports/components/report-filters";
import { SalesReportTable } from "@/modules/reports/components/sales-report-table";
import {
  ExportCsvButton,
  ReportPagination,
} from "@/modules/reports/components/report-toolbar";
import { ErrorBlock } from "@/modules/reports/components/kpi-card";
import { PERIOD_PRESET_LABELS, formatCivilDate } from "@/modules/reports/lib/period";
import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("reports:view");
  const raw = await searchParams;
  const parsed = salesReportQuerySchema.safeParse({
    preset: firstSearchParam(raw, "preset") ?? "last_30",
    from: firstSearchParam(raw, "from"),
    to: firstSearchParam(raw, "to"),
    productId: firstSearchParam(raw, "productId"),
    customerId: firstSearchParam(raw, "customerId"),
    sellerId: firstSearchParam(raw, "sellerId"),
    status: firstSearchParam(raw, "status"),
    paymentMethod: firstSearchParam(raw, "paymentMethod"),
    page: firstSearchParam(raw, "page") ?? "1",
  });
  const query = parsed.success
    ? parsed.data
    : salesReportQuerySchema.parse({ page: 1 });

  try {
    const result = await getSalesReportForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    });
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Relatório de vendas
            </h1>
            <p className="text-muted-foreground">
              {PERIOD_PRESET_LABELS[result.range.preset]} ·{" "}
              {formatCivilDate(result.range.start)} até{" "}
              {formatCivilDate(result.range.end)} · {result.total} registro(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/app/reports">Voltar</Link>
            </Button>
            <ExportCsvButton type="sales" query={query} />
          </div>
        </div>
        <SalesReportFilters
          range={result.range}
          query={query}
          lookups={result.lookups}
        />
        <SalesReportTable items={result.items} />
        <ReportPagination
          href="/app/reports/sales"
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
        <h1 className="text-2xl font-semibold tracking-tight">Relatório de vendas</h1>
        <ErrorBlock>{message}</ErrorBlock>
      </div>
    );
  }
}
