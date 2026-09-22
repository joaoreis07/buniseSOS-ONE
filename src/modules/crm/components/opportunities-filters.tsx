import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { OPPORTUNITY_STAGE_LABELS } from "@/modules/crm/lib/opportunity-labels";

type OpportunitiesFiltersProps = {
  query: {
    q?: string | null;
    stage?: string | null;
    ownerId?: string | null;
    leadId?: string | null;
    customerId?: string | null;
    createdFrom?: string | null;
    createdTo?: string | null;
  };
  owners: Array<{ id: string; name: string | null; email: string }>;
  leads: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
};

export function OpportunitiesFilters({
  query,
  owners,
  leads,
  customers,
}: OpportunitiesFiltersProps) {
  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          placeholder="Nome, lead, cliente, observações"
          defaultValue={query.q ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="stage">Estágio</Label>
        <select
          id="stage"
          name="stage"
          defaultValue={query.stage ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {Object.entries(OPPORTUNITY_STAGE_LABELS).map(([value, label]) => (
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
        <Label htmlFor="leadId">Lead</Label>
        <select
          id="leadId"
          name="leadId"
          defaultValue={query.leadId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name}
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
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
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
        <Button type="submit">Filtrar</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/app/crm/opportunities">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
