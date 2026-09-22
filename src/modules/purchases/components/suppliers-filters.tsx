import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { SUPPLIER_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";
import type { SupplierListQuery } from "@/modules/purchases/schemas/supplier.schemas";

export function SuppliersFilters({ query }: { query: SupplierListQuery }) {
  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Nome, documento ou e-mail"
        />
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
          {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/suppliers">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
