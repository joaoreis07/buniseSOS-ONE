import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import type { CommunicationListQuery } from "@/modules/communications/schemas/communication.schemas";

type CommunicationsFiltersProps = {
  query: CommunicationListQuery;
  customers: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; name: string | null; email: string | null }>;
};

export function CommunicationsFilters({
  query,
  customers,
  authors,
}: CommunicationsFiltersProps) {
  const exportParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query)
        .filter(([, value]) => value != null && value !== "")
        .map(([key, value]) => [key, String(value)]),
    ),
  );

  return (
    <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor="q">Busca</Label>
        <Input
          id="q"
          name="q"
          placeholder="Cliente, assunto, destinatário"
          defaultValue={query.q ?? ""}
        />
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
        <Label htmlFor="userId">Responsável</Label>
        <select
          id="userId"
          name="userId"
          defaultValue={query.userId ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name ?? author.email}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="channel">Canal</Label>
        <select
          id="channel"
          name="channel"
          defaultValue={query.channel ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {Object.entries(COMMUNICATION_CHANNEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          defaultValue={query.type ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {Object.entries(COMMUNICATION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          {Object.entries(COMMUNICATION_STATUS_LABELS).map(([value, label]) => (
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
          {Object.entries(COMMUNICATION_ORIGIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
      <div className="flex flex-wrap items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild type="button" variant="outline">
          <Link href="/app/communications">Limpar</Link>
        </Button>
        <Button asChild type="button" variant="outline">
          <a href={`/app/communications/export?${exportParams.toString()}`}>
            Exportar CSV
          </a>
        </Button>
      </div>
    </form>
  );
}
