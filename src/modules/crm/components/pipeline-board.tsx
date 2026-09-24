"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Opportunity, OpportunityStage } from "@prisma/client";
import { moveOpportunityStageAction } from "@/modules/crm/actions/pipeline.actions";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
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

const STAGE_BORDER: Record<OpportunityStage, string> = {
  NEW: "border-t-slate-300",
  QUALIFIED: "border-t-sky-400",
  PROPOSAL: "border-t-blue-500",
  NEGOTIATION: "border-t-violet-500",
  WON: "border-t-emerald-500",
  LOST: "border-t-red-400",
};

export function PipelineBoard({
  columns,
  canManage,
  canCreate,
}: {
  columns: Column[];
  canManage: boolean;
  canCreate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<OpportunityStage | null>(null);

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Visão kanban do funil de vendas</p>
        {canCreate ? (
          <Button asChild size="sm">
            <Link href="/app/crm/opportunities/new">
              <Plus className="size-3.5" aria-hidden />
              Nova oportunidade
            </Link>
          </Button>
        ) : null}
      </div>

      {pending ? (
        <p className="text-xs text-slate-400">Atualizando funil…</p>
      ) : null}

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
        {columns.map((column) => {
          const annualTotal = column.totalValue * 12;
          return (
            <div key={column.stage} className="w-64 shrink-0">
              <section
                className={cn(
                  "overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-white",
                  STAGE_BORDER[column.stage],
                  dropTarget === column.stage && "ring-2 ring-[var(--bos-primary)]/30",
                )}
                onDragOver={(e) => {
                  if (!canManage) return;
                  e.preventDefault();
                  setDropTarget(column.stage);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  const id = e.dataTransfer.getData("text/opportunity-id");
                  if (id && canManage) move(id, column.stage);
                  setDraggingId(null);
                }}
              >
                <header className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {OPPORTUNITY_STAGE_LABELS[column.stage]}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{column.count}</span>
                  </div>
                  {annualTotal > 0 ? (
                    <div className="mt-0.5 text-xs font-semibold text-slate-500">
                      {formatMoneyBRL(annualTotal)}/ano
                    </div>
                  ) : null}
                </header>
                <div className="min-h-32 space-y-2 p-3">
                  {column.items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-300">
                      Sem oportunidades
                    </div>
                  ) : (
                    column.items.map((item) => (
                      <article
                        key={item.id}
                        draggable={canManage}
                        onDragStart={(e) => {
                          if (!canManage) return;
                          e.dataTransfer.setData("text/opportunity-id", item.id);
                          setDraggingId(item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={cn(
                          "cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all hover:border-slate-300 hover:shadow-sm",
                          draggingId === item.id && "opacity-50",
                        )}
                      >
                        <Link
                          href={`/app/crm/opportunities/${item.id}`}
                          className="mb-1 block text-xs font-semibold leading-tight text-slate-800 hover:text-[var(--bos-primary)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.name}
                        </Link>
                        <div className="mb-2 text-xs text-slate-400">
                          {item.customer?.name ?? item.lead?.name ?? "Sem vínculo"}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--bos-primary)]">
                            {formatMoneyBRL(item.estimatedValue)}/mês
                          </span>
                          <span className="text-[10px] text-slate-400">{item.probability}%</span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[var(--bos-primary)]"
                            style={{ width: `${item.probability}%` }}
                          />
                        </div>
                      </article>
                    ))
                  )}
                  {canCreate ? (
                    <Link
                      href="/app/crm/opportunities/new"
                      className="block w-full rounded-lg border border-dashed border-slate-200 py-2 text-center text-xs text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                    >
                      + Adicionar
                    </Link>
                  ) : null}
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
}
