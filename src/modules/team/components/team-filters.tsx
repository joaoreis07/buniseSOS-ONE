import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ROLE_LABELS } from "@/modules/team/lib/labels";
import type { TeamListQuery } from "@/modules/team/schemas/team.schemas";

export function TeamFilters({ query }: { query: TeamListQuery }) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor="filter-q">Nome ou e-mail</Label>
        <Input
          id="filter-q"
          name="q"
          placeholder="Buscar membro"
          defaultValue={query.q ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-role">Função</Label>
        <select
          id="filter-role"
          name="role"
          defaultValue={query.role ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todas</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-status">Status</Label>
        <select
          id="filter-status"
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>
      <div className="flex items-end gap-2 lg:col-span-4">
        <Button type="submit">Filtrar</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/app/settings/team">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
