import type { Role } from "@prisma/client";
import { hasPermission } from "@/shared/permissions/rbac";
import { PageTabs } from "@/shared/components/page-layout";

type ProductsTab = "products" | "categories";

export function ProductsSubnav({
  role,
  active,
}: {
  role: Role;
  active: ProductsTab;
}) {
  const items = [
    hasPermission(role, "products:view")
      ? { key: "products" as const, href: "/app/products", label: "Produtos" }
      : null,
    hasPermission(role, "categories:view")
      ? {
          key: "categories" as const,
          href: "/app/products/categories",
          label: "Categorias",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: ProductsTab;
    href: string;
    label: string;
  }>;

  if (items.length === 0) return null;

  return (
    <PageTabs
      active={active}
      items={items.map((item) => ({
        id: item.key,
        href: item.href,
        label: item.label,
      }))}
    />
  );
}
