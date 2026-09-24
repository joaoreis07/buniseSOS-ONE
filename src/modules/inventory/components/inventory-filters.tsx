import Link from "next/link";
import { Search } from "lucide-react";
import type { InventoryListQuery } from "@/modules/inventory/schemas/inventory.schemas";
import { FilterPillNav } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const STOCK_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "low", label: "Estoque baixo" },
  { value: "out", label: "Sem estoque" },
];

export function InventoryFilters({
  query,
  categories,
}: {
  query: InventoryListQuery;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id="q"
            name="q"
            placeholder="Buscar produto ou SKU…"
            defaultValue={query.q ?? ""}
            className="h-9 w-full pl-9 sm:w-64"
          />
        </div>
        <FilterPillNav
          basePath="/app/inventory"
          param="stock"
          active={query.stock ?? ""}
          options={STOCK_OPTIONS}
          preserve={{
            q: query.q,
            categoryId: query.categoryId,
            status: query.status,
          }}
        />
      </div>

      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Mostrar filtros avançados</span>
          <span className="hidden group-open:inline">Ocultar filtros avançados</span>
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label htmlFor="status">Status produto</Label>
            <select
              id="status"
              name="status"
              defaultValue={query.status ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>
          {query.stock ? (
            <input type="hidden" name="stock" value={query.stock} />
          ) : null}
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/app/inventory">Limpar</Link>
            </Button>
          </div>
        </div>
      </details>
    </form>
  );
}
