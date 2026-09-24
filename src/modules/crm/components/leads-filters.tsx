import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  LEAD_ORIGIN_LABELS,
  LEAD_STATUS_LABELS,
} from "@/modules/crm/lib/lead-labels";

type LeadsFiltersProps = {
  query: {
    q?: string | null;
    status?: string | null;
    origin?: string | null;
    ownerId?: string | null;
    createdFrom?: string | null;
    createdTo?: string | null;
  };
  owners: Array<{ id: string; name: string | null; email: string }>;
  actions?: ReactNode;
};

export function LeadsFilters({ query, owners, actions }: LeadsFiltersProps) {
  return (
    <form className="space-y-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id="q"
            name="q"
            placeholder="Buscar leads…"
            defaultValue={query.q ?? ""}
            className="h-9 w-full pl-9 sm:w-64"
          />
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="origin">Origem</Label>
          <select
            id="origin"
            name="origin"
            defaultValue={query.origin ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            <option value="">Todas</option>
            {Object.entries(LEAD_ORIGIN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ownerId">Responsável</Label>
          <select
            id="ownerId"
            name="ownerId"
            defaultValue={query.ownerId ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name ?? owner.email}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="createdFrom">Cadastro de</Label>
          <Input
            id="createdFrom"
            name="createdFrom"
            type="date"
            defaultValue={query.createdFrom ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="createdTo">Cadastro até</Label>
          <Input
            id="createdTo"
            name="createdTo"
            type="date"
            defaultValue={query.createdTo ?? ""}
          />
        </div>
        <div className="flex items-end gap-2 lg:col-span-6">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/app/crm/leads">Limpar</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
