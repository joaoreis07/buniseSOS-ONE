"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Opportunity, OpportunityStage } from "@prisma/client";
import { moveOpportunityStageAction } from "@/modules/crm/actions/pipeline.actions";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatDateBR,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utilities/cn";

type PipelineCard = Opportunity & {
  owner: { id: string; name: string | null; email: string } | null;
  lead: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
};

type Column = {
  stage: OpportunityStage;
  items: PipelineCard[];
  count: number;
  totalValue: number;
};

const STAGES: OpportunityStage[] = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export function PipelineBoard({
  columns,
  canManage,
}: {
  columns: Column[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(opportunityId: string, stage: OpportunityStage) {
    const formData = new FormData();
    formData.set("opportunityId", opportunityId);
    formData.set("stage", stage);
    startTransition(async () => {
      await moveOpportunityStageAction(formData);
    });
  }

  return (
    <div className="space-y-3">
      {pending ? (
        <p className="text-sm text-muted-foreground">Atualizando funil...</p>
      ) : null}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <section
            key={column.stage}
            className="w-[280px] shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {OPPORTUNITY_STAGE_LABELS[column.stage]}
                </h2>
                <Badge variant="secondary">{column.count}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatMoneyBRL(column.totalValue)}
              </p>
            </header>
            <div className="space-y-2 p-2">
              {column.items.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Vazio
                </p>
              ) : (
                column.items.map((item) => (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-md border bg-card p-3 shadow-sm",
                      "space-y-2",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/app/crm/opportunities/${item.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {item.probability}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.customer?.name ?? item.lead?.name ?? "Sem vínculo"}
                    </p>
                    <p className="text-xs">
                      {item.owner?.name ?? item.owner?.email ?? "Sem responsável"}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{formatMoneyBRL(item.estimatedValue)}</span>
                      <span className="text-muted-foreground">
                        {formatDateBR(item.expectedCloseDate)}
                      </span>
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {STAGES.filter((stage) => stage !== item.stage).map(
                          (stage) => (
                            <Button
                              key={stage}
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              disabled={pending}
                              onClick={() => move(item.id, stage)}
                            >
                              → {OPPORTUNITY_STAGE_LABELS[stage]}
                            </Button>
                          ),
                        )}
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
