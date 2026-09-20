import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { inventoryListQuerySchema } from "@/modules/inventory/schemas/inventory.schemas";
import { listInventoryForTenant } from "@/modules/inventory/services/inventory.service";
import { InventoryFilters } from "@/modules/inventory/components/inventory-filters";
import {
  InventorySummaryCards,
  InventoryTable,
} from "@/modules/inventory/components/inventory-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description={`Controle de produtos físicos · ${result.total} item(ns) na listagem`}
      />

      <InventorySummaryCards summary={result.summary} />
      <InventoryFilters query={query} categories={result.categories} />
      <InventoryTable items={result.items} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/inventory?${new URLSearchParams({
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
                href={`/app/inventory?${new URLSearchParams({
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
