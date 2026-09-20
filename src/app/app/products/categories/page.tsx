import { requirePermission } from "@/shared/auth/session";
import { categoryListQuerySchema } from "@/modules/products/schemas/category.schemas";
import {
  canManageCategories,
  listCategoriesForTenant,
} from "@/modules/products/services/category.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { CategoriesManager } from "@/modules/products/components/categories-manager";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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
    <PageContainer>
      <ProductsSubnav role={user.role} active="categories" />
      <PageHeader
        eyebrow="Produtos"
        title="Categorias"
        description={`Organização do catálogo · ${result.total} categoria(s)`}
      />
      <CategoriesManager
        items={result.items}
        canManage={canManage}
        queryQ={query.q}
      />
    </PageContainer>
  );
}
