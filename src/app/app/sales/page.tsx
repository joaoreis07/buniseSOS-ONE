import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/shared/auth/session";
import { saleListQuerySchema } from "@/modules/sales/schemas/sale.schemas";
import {
  canCreateSales,
  listSalesForTenant,
} from "@/modules/sales/services/sale.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { SalesFilters } from "@/modules/sales/components/sales-filters";
import { SalesKpis, SalesTable } from "@/modules/sales/components/sales-table";
import { Button } from "@/shared/ui/button";
import {
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";

function buildPageHref(
  query: Record<string, unknown>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "" || key === "page") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return `/app/sales?${params.toString()}`;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("sales:view");
  const raw = await searchParams;
  const parsed = saleListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    customerId: typeof raw.customerId === "string" ? raw.customerId : undefined,
    sellerId: typeof raw.sellerId === "string" ? raw.sellerId : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : saleListQuerySchema.parse({ page: 1 });

  const [result, usage] = await Promise.all([
    listSalesForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getCompanyUsageSnapshot(user.companyId),
  ]);
  const canCreate = canCreateSales(user.role);
  const salesUsage = usage.find((u) => u.feature === "sales_month");

  const subtitle = salesUsage?.limit
    ? `${salesUsage.used} / ${salesUsage.limit} vendas este mês (plano Free)`
    : `${result.total} registro(s)`;

  return (
    <PageContainer>
      <ModulePageHeader
        title="Vendas"
        subtitle={subtitle}
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/app/sales/new">
                <Plus className="mr-1.5 size-3.5" aria-hidden />
                Nova venda
              </Link>
            </Button>
          ) : null
        }
      />

      <SalesKpis kpis={result.kpis} />

      <SalesFilters
        query={query}
        customers={result.customers}
        sellers={result.sellers}
      />

      <SalesTable items={result.items} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel={result.total === 1 ? "venda" : "vendas"}
        prevHref={
          result.page > 1 ? buildPageHref(query, result.page - 1) : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? buildPageHref(query, result.page + 1)
            : undefined
        }
      />
    </PageContainer>
  );
}
