import Link from "next/link";
import type { SaleListQuery } from "@/modules/sales/schemas/sale.schemas";
import { SALE_STATUS_LABELS } from "@/modules/sales/lib/sale-labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function SalesFilters({
  query,
  customers,
  sellers,
}: {
  query: SaleListQuery;
  customers: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; name: string | null; email: string }>;
}) {
  return (
    <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          placeholder="Número, cliente, vendedor…"
          defaultValue={query.q ?? ""}
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
          {Object.entries(SALE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="customerId">Cliente</Label>
        <select
          id="customerId"
          name="customerId"
          defaultValue={query.customerId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="sellerId">Vendedor</Label>
        <select
          id="sellerId"
          name="sellerId"
          defaultValue={query.sellerId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.name ?? seller.email}
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
      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/sales">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
