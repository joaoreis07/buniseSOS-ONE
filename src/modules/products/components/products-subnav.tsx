import type { Role } from "@prisma/client";
import { hasPermission } from "@/shared/permissions/rbac";
import { PageTabs } from "@/shared/components/page-layout";

type ProductsTab = "products" | "categories";

export function ProductsSubnav({
  role,
  active,
  variant = "app",
}: {
  role?: Role;
  active: ProductsTab;
  variant?: "app" | "demo";
}) {
  const base = variant === "demo" ? "/demo/products" : "/app/products";
  const items = [
    variant === "demo" || (role && hasPermission(role, "products:view"))
      ? { key: "products" as const, href: base, label: "Produtos" }
      : null,
    variant === "demo" || (role && hasPermission(role, "categories:view"))
      ? {
          key: "categories" as const,
          href: `${base}/categories`,
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
