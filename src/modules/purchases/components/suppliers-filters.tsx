import Link from "next/link";
import { Search } from "lucide-react";
import type { SupplierListQuery } from "@/modules/purchases/schemas/supplier.schemas";
import { SUPPLIER_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";
import { FilterPillNav } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  ...Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function SuppliersFilters({ query }: { query: SupplierListQuery }) {
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
            placeholder="Buscar por nome, documento ou e-mail…"
            className="h-9 w-full pl-9 sm:w-72"
          />
        </div>
        <FilterPillNav
          basePath="/app/suppliers"
          param="status"
          active={query.status ?? ""}
          options={STATUS_OPTIONS}
          preserve={{ q: query.q }}
        />
        <div className="flex items-end gap-2 sm:ml-auto">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/app/suppliers">Limpar</Link>
          </Button>
        </div>
      </div>
      {query.status ? (
        <input type="hidden" name="status" value={query.status} />
      ) : null}
    </form>
  );
}
