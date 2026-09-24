import { requirePermission } from "@/shared/auth/session";
import { inventoryListQuerySchema } from "@/modules/inventory/schemas/inventory.schemas";
import { listInventoryForTenant } from "@/modules/inventory/services/inventory.service";
import { InventoryFilters } from "@/modules/inventory/components/inventory-filters";
import {
  InventoryHeaderSubtitle,
  InventorySummaryCards,
  InventoryTable,
} from "@/modules/inventory/components/inventory-table";
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

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("inventory:view");
  const raw = await searchParams;
  const parsed = inventoryListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    stock: typeof raw.stock === "string" ? raw.stock : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : inventoryListQuerySchema.parse({ page: 1 });

  const result = await listInventoryForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });

  return (
    <PageContainer>
      <ModulePageHeader
        title="Estoque"
        subtitle={<InventoryHeaderSubtitle summary={result.summary} />}
      />

      <InventorySummaryCards summary={result.summary} />
      <InventoryFilters query={query} categories={result.categories} />
      <InventoryTable items={result.items} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="item(ns)"
        prevHref={
          result.page > 1
            ? `/app/inventory?${toQueryParams(query, result.page - 1)}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/inventory?${toQueryParams(query, result.page + 1)}`
            : undefined
        }
      />
    </PageContainer>
  );
}
