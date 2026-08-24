import Link from "next/link";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/shared/permissions/rbac";
import { cn } from "@/shared/utilities/cn";

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
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            active === item.key
              ? "bg-emerald-50 font-medium text-emerald-900"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
