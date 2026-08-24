import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { productListQuerySchema } from "@/modules/products/schemas/product.schemas";
import {
  canManageProducts,
  getProductFormMeta,
  listProductsForTenant,
} from "@/modules/products/services/product.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { ProductsFilters } from "@/modules/products/components/products-filters";
import { ProductsTable } from "@/modules/products/components/products-table";
import { Button } from "@/shared/ui/button";

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

  const [result, meta] = await Promise.all([
    listProductsForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getProductFormMeta(user.companyId),
  ]);
  const canManage = canManageProducts(user.role);

  return (
    <div className="space-y-6">
      <ProductsSubnav role={user.role} active="products" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Catálogo de produtos e serviços · {result.total} registro(s)
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/app/products/new">Novo produto</Link>
          </Button>
        ) : null}
      </div>

      <ProductsFilters query={query} categories={meta.categories} />
      <ProductsTable items={result.items} canManage={canManage} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/products?${new URLSearchParams({
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
                href={`/app/products?${new URLSearchParams({
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
    </div>
  );
}
