import Link from "next/link";
import type { InventoryListQuery } from "@/modules/inventory/schemas/inventory.schemas";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function InventoryFilters({
  query,
  categories,
}: {
  query: InventoryListQuery;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 lg:grid-cols-5">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="q">Produto / SKU</Label>
        <Input id="q" name="q" defaultValue={query.q ?? ""} />
      </div>
      <div className="space-y-1">
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
      <div className="space-y-1">
        <Label htmlFor="status">Status produto</Label>
        <select
          id="status"
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="stock">Estoque</Label>
        <select
          id="stock"
          name="stock"
          defaultValue={query.stock ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          <option value="low">Baixo</option>
          <option value="out">Sem estoque</option>
        </select>
      </div>
      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/inventory">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
