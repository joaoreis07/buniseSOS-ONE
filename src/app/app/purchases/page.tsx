import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/shared/auth/session";
import { purchaseListQuerySchema } from "@/modules/purchases/schemas/purchase.schemas";
import {
  canCreatePurchases,
  listPurchasesForTenant,
} from "@/modules/purchases/services/purchase.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { PurchasesFilters } from "@/modules/purchases/components/purchases-filters";
import {
  PurchaseKpis,
  PurchasesTable,
} from "@/modules/purchases/components/purchases-table";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Button } from "@/shared/ui/button";
import {
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";

function toQueryParams(query: Record<string, unknown>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "" || key === "page") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return params.toString();
}

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

  const [result, usage] = await Promise.all([
    listPurchasesForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getCompanyUsageSnapshot(user.companyId),
  ]);
  const purchaseUsage = usage.find((u) => u.feature === "purchases_month");
  const canCreate = canCreatePurchases(user.role);

  const usageLine = purchaseUsage?.limit
    ? `${purchaseUsage.used} / ${purchaseUsage.limit} compras/mês (plano Free)`
    : null;

  const subtitle = (
    <>
      Total no período:{" "}
      <strong className="text-slate-700">
        {formatMoneyBRL(result.kpis.monthValue)}
      </strong>
      {usageLine ? (
        <>
          {" "}
          · {usageLine}
        </>
      ) : null}
    </>
  );

  return (
    <PageContainer>
      <ModulePageHeader
        title="Compras"
        subtitle={subtitle}
        actions={
          canCreate ? (
            <Button asChild size="sm">
              <Link href="/app/purchases/new">
                <Plus className="size-3.5" aria-hidden />
                Nova compra
              </Link>
            </Button>
          ) : null
        }
      />

      <PurchaseKpis kpis={result.kpis} />
      <PurchasesFilters query={query} suppliers={result.suppliers} />
      <PurchasesTable items={result.items} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="compra(s)"
        prevHref={
          result.page > 1
            ? `/app/purchases?${toQueryParams(query, result.page - 1)}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/purchases?${toQueryParams(query, result.page + 1)}`
            : undefined
        }
      />
    </PageContainer>
  );
}
