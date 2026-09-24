import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/shared/auth/session";
import { productListQuerySchema } from "@/modules/products/schemas/product.schemas";
import {
  canManageProducts,
  getProductFormMeta,
  listProductsForTenant,
} from "@/modules/products/services/product.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { ProductsFilters } from "@/modules/products/components/products-filters";
import { ProductsTable } from "@/modules/products/components/products-table";
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("products:view");
  const raw = await searchParams;
  const parsed = productListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    sku: typeof raw.sku === "string" ? raw.sku : undefined,
    barcode: typeof raw.barcode === "string" ? raw.barcode : undefined,
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });
  const query = parsed.success
    ? parsed.data
    : productListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, meta, usage] = await Promise.all([
    listProductsForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getProductFormMeta(user.companyId),
    getCompanyUsageSnapshot(user.companyId),
  ]);
  const productUsage = usage.find((u) => u.feature === "products");
  const canManage = canManageProducts(user.role);

  const usageSubtitle = productUsage?.limit
    ? `${productUsage.used} / ${productUsage.limit} produtos (plano Free)`
    : `${result.total} registro(s)`;

  return (
    <PageContainer>
      <ProductsSubnav role={user.role} active="products" />

      <ModulePageHeader
        title="Produtos e Serviços"
        subtitle={usageSubtitle}
        actions={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/app/products/new">
                <Plus className="size-3.5" aria-hidden />
                Novo produto
              </Link>
            </Button>
          ) : null
        }
      />

      <ProductsFilters query={query} categories={meta.categories} />
      <ProductsTable items={result.items} canManage={canManage} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="produto(s)"
        prevHref={
          result.page > 1
            ? `/app/products?${toQueryParams(query, result.page - 1)}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/products?${toQueryParams(query, result.page + 1)}`
            : undefined
        }
      />
    </PageContainer>
  );
}
