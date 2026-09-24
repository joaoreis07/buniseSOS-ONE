import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import type { SaleListQuery } from "@/modules/sales/schemas/sale.schemas";
import { SALE_STATUS_LABELS } from "@/modules/sales/lib/sale-labels";
import { FilterPillNav } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function SalesFilters({
  query,
  customers,
  sellers,
  actions,
}: {
  query: SaleListQuery;
  customers: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; name: string | null; email: string }>;
  actions?: ReactNode;
}) {
  const preserve = {
    q: query.q,
    customerId: query.customerId,
    sellerId: query.sellerId,
    from: query.from,
    to: query.to,
  };

  const statusOptions = [
    { value: "", label: "Todos" },
    ...Object.entries(SALE_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <form className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              id="q"
              name="q"
              placeholder="Buscar por número ou cliente…"
              defaultValue={query.q ?? ""}
              className="h-9 w-full pl-9 sm:w-72"
            />
          </div>
          <FilterPillNav
            basePath="/app/sales"
            active={query.status ?? ""}
            options={statusOptions}
            preserve={preserve}
          />
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-500">
          Filtros avançados
        </summary>
        <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
            <Button type="submit">Filtrar</Button>
            <Button asChild variant="outline">
              <Link href="/app/sales">Limpar</Link>
            </Button>
          </div>
        </div>
      </details>
    </form>
  );
}
