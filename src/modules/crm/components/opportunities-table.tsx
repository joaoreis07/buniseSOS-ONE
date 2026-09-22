import Link from "next/link";
import type { Opportunity, OpportunityStage } from "@prisma/client";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatDateBR,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
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

type OpportunityRow = Opportunity & {
  owner: { id: string; name: string | null; email: string } | null;
  lead: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
};

function stageVariant(stage: OpportunityStage) {
  if (stage === "WON") return "default" as const;
  if (stage === "LOST") return "destructive" as const;
  return "secondary" as const;
}

export function OpportunitiesTable({
  items,
  canManage,
}: {
  items: OpportunityRow[];
  canManage: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhuma oportunidade encontrada.
        {canManage ? (
          <>
            {" "}
            <Link
              href="/app/crm/opportunities/new"
              className="text-emerald-700 underline"
            >
              Criar a primeira
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead className="hidden md:table-cell">Valor</TableHead>
            <TableHead className="hidden sm:table-cell">Prob.</TableHead>
            <TableHead className="hidden lg:table-cell">Previsão</TableHead>
            <TableHead className="hidden md:table-cell">Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.customer?.name ?? item.lead?.name ?? "—"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={stageVariant(item.stage)}>
                  {OPPORTUNITY_STAGE_LABELS[item.stage]}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatMoneyBRL(item.estimatedValue)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {item.probability}%
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDateBR(item.expectedCloseDate)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {item.owner?.name ?? item.owner?.email ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/app/crm/opportunities/${item.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
