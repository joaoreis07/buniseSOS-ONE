import Link from "next/link";
import type { ReactNode } from "react";
import { Layers, Package, Search } from "lucide-react";
import type { ProductListQuery } from "@/modules/products/schemas/product.schemas";
import {
  PRODUCT_STATUS_LABELS,
} from "@/modules/products/lib/product-labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/utilities/cn";

const TYPE_PILL_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "PRODUCT", label: "Produtos", icon: Package },
  { value: "SERVICE", label: "Serviços", icon: Layers },
] as const;

export function ProductsFilters({
  query,
  categories,
  actions,
}: {
  query: ProductListQuery;
  categories: Array<{ id: string; name: string }>;
  actions?: ReactNode;
}) {
  const activeType = query.type ?? "";

  return (
    <form className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              id="q"
              name="q"
              placeholder="Buscar por nome ou SKU…"
              defaultValue={query.q ?? ""}
              className="h-9 w-full pl-9 sm:w-64"
            />
          </div>
          <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
            {TYPE_PILL_OPTIONS.map((option) => {
              const Icon = "icon" in option ? option.icon : null;
              const params = new URLSearchParams();
              for (const [key, val] of Object.entries(query)) {
                if (val != null && val !== "" && key !== "type" && key !== "page") {
                  params.set(key, String(val));
                }
              }
              if (option.value) params.set("type", option.value);
              const href = params.toString()
                ? `/app/products?${params.toString()}`
                : "/app/products";
              const isActive = activeType === option.value;
              return (
                <Link
                  key={option.value || "all"}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {Icon ? <Icon className="size-3" aria-hidden /> : null}
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Mostrar filtros avançados</span>
          <span className="hidden group-open:inline">Ocultar filtros avançados</span>
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={query.sku ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="barcode">Código de barras</Label>
            <Input
              id="barcode"
              name="barcode"
              defaultValue={query.barcode ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={query.status ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Todos</option>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={query.categoryId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {query.type ? (
            <input type="hidden" name="type" value={query.type} />
          ) : null}
          <div className="flex items-end gap-2 lg:col-span-6">
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/app/products">Limpar</Link>
            </Button>
          </div>
        </div>
      </details>
    </form>
  );
}
