import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type CustomersFiltersProps = {
  actions?: ReactNode;
  query: {
    q?: string | null;
    status?: string | null;
    origin?: string | null;
    ownerId?: string | null;
    createdFrom?: string | null;
    createdTo?: string | null;
    commerce?: string | null;
    balance?: string | null;
  };
  origins: string[];
  owners: Array<{ id: string; name: string | null; email: string }>;
};

export function CustomersFilters({
  query,
  origins,
  owners,
  actions,
}: CustomersFiltersProps) {
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
            placeholder="Buscar clientes…"
            defaultValue={query.q ?? ""}
            className="h-9 w-full pl-9 sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2">{actions}</div>
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
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="BLOCKED">Bloqueado</option>
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
          {origins.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
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
      <div className="space-y-1">
        <Label htmlFor="commerce">Compras</Label>
        <select
          id="commerce"
          name="commerce"
          defaultValue={query.commerce ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          <option value="with_sales">Com compras</option>
          <option value="without_sales">Sem compras</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="balance">Financeiro</Label>
        <select
          id="balance"
          name="balance"
          defaultValue={query.balance ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          <option value="open">Saldo em aberto</option>
          <option value="overdue">Inadimplentes</option>
        </select>
      </div>
      <div className="flex items-end gap-2 lg:col-span-6">
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/app/crm">Limpar</Link>
        </Button>
      </div>
      </div>
    </form>
  );
}
