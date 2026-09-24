import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import type { FinanceListQuery } from "@/modules/finance/schemas/finance.schemas";
import { FilterBar, FilterPillNav } from "@/shared/components/page-layout";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "", label: "Todas" },
  ...Object.entries(RECEIVABLE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export function FinanceFilters({
  query,
  customers,
}: {
  query: FinanceListQuery;
  customers: Array<{ id: string; name: string }>;
}) {
  const preserve = {
    q: query.q,
    customerId: query.customerId,
  };

  return (
    <div className="space-y-3">
      <FilterPillNav
        basePath="/app/finance"
        param="status"
        active={query.status ?? ""}
        options={STATUS_OPTIONS}
        preserve={preserve}
      />
      <FilterBar>
        <form className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="q">Busca</Label>
            <Input
              id="q"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Cliente ou venda"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerId">Cliente</Label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={query.customerId ?? ""}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">Todos</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          {query.status ? (
            <input type="hidden" name="status" value={query.status} />
          ) : null}
          <div className="flex items-end gap-2">
            <Button type="submit">Filtrar</Button>
            <Button asChild variant="outline">
              <Link href="/app/finance">Limpar</Link>
            </Button>
          </div>
        </form>
      </FilterBar>
    </div>
  );
}
