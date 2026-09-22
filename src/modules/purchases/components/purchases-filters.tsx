import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PURCHASE_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";
import type { PurchaseListQuery } from "@/modules/purchases/schemas/purchase.schemas";

export function PurchasesFilters({
  query,
  suppliers,
}: {
  query: PurchaseListQuery;
  suppliers: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Número, fornecedor…"
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
          {Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="supplierId">Fornecedor</Label>
        <select
          id="supplierId"
          name="supplierId"
          defaultValue={query.supplierId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
      <div className="flex items-end gap-2 lg:col-span-6">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/purchases">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
