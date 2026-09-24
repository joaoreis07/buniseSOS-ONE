import Link from "next/link";
import { Search } from "lucide-react";
import type { PurchaseListQuery } from "@/modules/purchases/schemas/purchase.schemas";
import { PURCHASE_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";
import { FilterPillNav } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  ...Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function PurchasesFilters({
  query,
  suppliers,
}: {
  query: PurchaseListQuery;
  suppliers: Array<{ id: string; name: string }>;
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
            defaultValue={query.q ?? ""}
            placeholder="Buscar por fornecedor ou número…"
            className="h-9 w-full pl-9 sm:w-72"
          />
        </div>
        <FilterPillNav
          basePath="/app/purchases"
          param="status"
          active={query.status ?? ""}
          options={STATUS_OPTIONS}
          preserve={{
            q: query.q,
            supplierId: query.supplierId,
            from: query.from,
            to: query.to,
          }}
        />
      </div>

      <details className="group rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Mostrar filtros avançados</span>
          <span className="hidden group-open:inline">Ocultar filtros avançados</span>
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="supplierId">Fornecedor</Label>
            <select
              id="supplierId"
              name="supplierId"
              defaultValue={query.supplierId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Todos</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="from">De</Label>
            <Input id="from" name="from" type="date" defaultValue={query.from ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">Até</Label>
            <Input id="to" name="to" type="date" defaultValue={query.to ?? ""} />
          </div>
          {query.status ? (
            <input type="hidden" name="status" value={query.status} />
          ) : null}
          <div className="flex items-end gap-2 lg:col-span-6">
            <Button type="submit" size="sm">
              Filtrar
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/app/purchases">Limpar</Link>
            </Button>
          </div>
        </div>
      </details>
    </form>
  );
}
