import Link from "next/link";
import type { Opportunity, OpportunityStage } from "@prisma/client";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatDateBR,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
import { Badge } from "@/shared/ui/badge";

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
  summary,
}: {
  items: OpportunityRow[];
  canManage: boolean;
  summary?: { count: number; totalValue: number };
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhuma oportunidade encontrada.
        {canManage ? (
          <>
            {" "}
            <Link
              href="/app/crm/opportunities/new"
              className="text-[var(--bos-primary)] hover:underline"
            >
              Criar a primeira
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  const totalAnnual =
    summary?.totalValue ??
    items.reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0) * 12;

  return (
    <div className="space-y-4">
      {summary ? (
        <p className="text-sm text-slate-500">
          {summary.count} oportunidade{summary.count === 1 ? "" : "s"} · valor total{" "}
          <span className="font-semibold text-slate-700">
            {formatMoneyBRL(totalAnnual)}/ano
          </span>
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Oportunidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Estágio
              </th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
                Valor/mês
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
                Prob.
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
                Fechamento
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/app/crm/opportunities/${item.id}`}
                    className="font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {item.customer?.name ?? item.lead?.name ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={stageVariant(item.stage)}>
                    {OPPORTUNITY_STAGE_LABELS[item.stage]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 md:table-cell">
                  {formatMoneyBRL(item.estimatedValue)}
                </td>
                <td className="hidden px-4 py-3.5 sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[var(--bos-primary)]"
                        style={{ width: `${item.probability}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{item.probability}%</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                  {formatDateBR(item.expectedCloseDate)}
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-500 md:table-cell">
                  {item.owner?.name ?? item.owner?.email ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
