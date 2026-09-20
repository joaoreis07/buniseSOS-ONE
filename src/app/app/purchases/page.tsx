import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { purchaseListQuerySchema } from "@/modules/purchases/schemas/purchase.schemas";
import {
  canCreatePurchases,
  listPurchasesForTenant,
} from "@/modules/purchases/services/purchase.service";
import { PurchasesFilters } from "@/modules/purchases/components/purchases-filters";
import {
  PurchaseKpis,
  PurchasesTable,
} from "@/modules/purchases/components/purchases-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("purchases:view");
  const raw = await searchParams;
  const parsed = purchaseListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    supplierId: typeof raw.supplierId === "string" ? raw.supplierId : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : purchaseListQuerySchema.parse({ page: 1 });
  const result = await listPurchasesForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });
  const canCreate = canCreatePurchases(user.role);

  function pageHref(page: number) {
    return `/app/purchases?${new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(query)
          .filter(([, value]) => value != null && value !== "")
          .map(([key, value]) => [key, String(value)]),
      ),
      page: String(page),
    }).toString()}`;
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Compras"
        description={`Recebimento de mercadorias · ${result.total} registro(s)`}
        actions={
          canCreate ? (
          <Button asChild>
            <Link href="/app/purchases/new">Nova compra</Link>
          </Button>
          ) : null
        }
      />
      <PurchaseKpis kpis={result.kpis} />
      <PurchasesFilters query={query} suppliers={result.suppliers} />
      <PurchasesTable items={result.items} />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page - 1)}>Anterior</Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page + 1)}>Próxima</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
