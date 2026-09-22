import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import type { FinanceListQuery } from "@/modules/finance/schemas/finance.schemas";
import Link from "next/link";

export function FinanceFilters({
  query,
  customers,
}: {
  query: FinanceListQuery;
  customers: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Cliente ou venda"
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
          {Object.entries(RECEIVABLE_STATUS_LABELS).map(([value, label]) => (
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
      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/finance">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
