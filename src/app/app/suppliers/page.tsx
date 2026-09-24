import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/shared/auth/session";
import { supplierListQuerySchema } from "@/modules/purchases/schemas/supplier.schemas";
import {
  canManageSuppliers,
  listSuppliersForTenant,
} from "@/modules/purchases/services/supplier.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { SuppliersFilters } from "@/modules/purchases/components/suppliers-filters";
import { SuppliersTable } from "@/modules/purchases/components/suppliers-table";
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

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("suppliers:view");
  const raw = await searchParams;
  const parsed = supplierListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : supplierListQuerySchema.parse({ page: 1 });

  const [result, usage] = await Promise.all([
    listSuppliersForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getCompanyUsageSnapshot(user.companyId),
  ]);
  const supplierUsage = usage.find((u) => u.feature === "suppliers");
  const canManage = canManageSuppliers(user.role);

  const usageSubtitle = supplierUsage?.limit
    ? `${supplierUsage.used} / ${supplierUsage.limit} fornecedores (plano Free)`
    : `${result.total} registro(s)`;

  return (
    <PageContainer>
      <ModulePageHeader
        title="Fornecedores"
        subtitle={usageSubtitle}
        actions={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/app/suppliers/new">
                <Plus className="size-3.5" aria-hidden />
                Novo fornecedor
              </Link>
            </Button>
          ) : null
        }
      />

      <SuppliersFilters query={query} />
      <SuppliersTable items={result.items} canManage={canManage} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="fornecedor(es)"
        prevHref={
          result.page > 1
            ? `/app/suppliers?${toQueryParams(query, result.page - 1)}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/suppliers?${toQueryParams(query, result.page + 1)}`
            : undefined
        }
      />
    </PageContainer>
  );
}
