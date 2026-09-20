import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { saleListQuerySchema } from "@/modules/sales/schemas/sale.schemas";
import {
  canCreateSales,
  listSalesForTenant,
} from "@/modules/sales/services/sale.service";
import { SalesFilters } from "@/modules/sales/components/sales-filters";
import { SalesKpis, SalesTable } from "@/modules/sales/components/sales-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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

  const result = await listSalesForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });
  const canCreate = canCreateSales(user.role);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Vendas"
        description={`PDV administrativo · ${result.total} registro(s)`}
        actions={
          canCreate ? (
          <Button asChild>
            <Link href="/app/sales/new">Nova venda</Link>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/sales?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(query)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => [k, String(v)]),
                  ),
                  page: String(result.page - 1),
                }).toString()}`}
              >
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/sales?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(query)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => [k, String(v)]),
                  ),
                  page: String(result.page + 1),
                }).toString()}`}
              >
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
