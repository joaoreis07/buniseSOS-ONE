import Link from "next/link";
import type { ProductListQuery } from "@/modules/products/schemas/product.schemas";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/modules/products/lib/product-labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function ProductsFilters({
  query,
  categories,
}: {
  query: ProductListQuery;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          placeholder="Nome, SKU, código…"
          defaultValue={query.q ?? ""}
        />
      </div>
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
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          defaultValue={query.type ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 md:col-span-2 lg:col-span-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={query.categoryId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2 md:col-span-1 lg:col-span-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/products">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
