import { requirePermission } from "@/shared/auth/session";
import { categoryListQuerySchema } from "@/modules/products/schemas/category.schemas";
import {
  canManageCategories,
  listCategoriesForTenant,
} from "@/modules/products/services/category.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { CategoriesManager } from "@/modules/products/components/categories-manager";

export default async function ProductCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("categories:view");
  const raw = await searchParams;
  const parsed = categoryListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : categoryListQuerySchema.parse({ page: 1 });

  const result = await listCategoriesForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });
  const canManage = canManageCategories(user.role);

  return (
    <div className="space-y-6">
      <ProductsSubnav role={user.role} active="categories" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground">
          Organização do catálogo · {result.total} categoria(s)
        </p>
      </div>
      <CategoriesManager
        items={result.items}
        canManage={canManage}
        queryQ={query.q}
      />
    </div>
  );
}
