import Link from "next/link";
import type { Lead, LeadStatus } from "@prisma/client";
import {
  LEAD_ORIGIN_LABELS,
  LEAD_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/lead-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type LeadRow = Lead & {
  owner: { id: string; name: string | null; email: string } | null;
};

function statusVariant(status: LeadStatus) {
  if (status === "QUALIFIED" || status === "CONVERTED") return "default" as const;
  if (status === "LOST" || status === "UNQUALIFIED") return "destructive" as const;
  return "secondary" as const;
}

export function LeadsTable({
  items,
  canManage,
}: {
  items: LeadRow[];
  canManage: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum lead encontrado.
        {canManage ? (
          <>
            {" "}
            <Link href="/app/crm/leads/new" className="text-emerald-700 underline">
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Origem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Responsável</TableHead>
            <TableHead className="hidden md:table-cell">Valor</TableHead>
            <TableHead className="hidden lg:table-cell">Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">{lead.name}</div>
                {lead.companyName ? (
                  <div className="text-xs text-muted-foreground">
                    {lead.companyName}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{lead.email ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {lead.whatsapp ?? lead.phone ?? "—"}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {LEAD_ORIGIN_LABELS[lead.origin]}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(lead.status)}>
                  {LEAD_STATUS_LABELS[lead.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {lead.owner?.name ?? lead.owner?.email ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatMoneyBRL(lead.estimatedValue)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {lead.createdAt.toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/app/crm/leads/${lead.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
