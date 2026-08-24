"use client";

import { useActionState, useState } from "react";
import type { Opportunity, OpportunityStage } from "@prisma/client";
import {
  createOpportunityAction,
  updateOpportunityAction,
  type OpportunityActionResult,
} from "@/modules/crm/actions/opportunity.actions";
import {
  OPPORTUNITY_STAGE_LABELS,
  toDateInputValue,
} from "@/modules/crm/lib/opportunity-labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type Option = { id: string; name: string | null; email?: string };

type OpportunityFormProps = {
  mode: "create" | "edit";
  opportunity?: Opportunity;
  owners: Option[];
  leads: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
};

function moneyDefault(value: Opportunity["estimatedValue"]): string {
  if (value == null) return "";
  return Number(value).toFixed(2);
}

export function OpportunityForm({
  mode,
  opportunity,
  owners,
  leads,
  customers,
}: OpportunityFormProps) {
  const action =
    mode === "create" ? createOpportunityAction : updateOpportunityAction;
  const [state, formAction, pending] = useActionState<
    OpportunityActionResult | undefined,
    FormData
  >(action, undefined);

  const [stage, setStage] = useState<OpportunityStage>(
    opportunity?.stage ?? "NEW",
  );
  const [ownerId, setOwnerId] = useState(opportunity?.ownerId ?? "");
  const [leadId, setLeadId] = useState(opportunity?.leadId ?? "");
  const [customerId, setCustomerId] = useState(opportunity?.customerId ?? "");

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && opportunity ? (
        <input type="hidden" name="opportunityId" value={opportunity.id} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={opportunity?.name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Estágio</Label>
          <input type="hidden" name="stage" value={stage} />
          <Select
            value={stage}
            onValueChange={(value) => setStage(value as OpportunityStage)}
          >
            <SelectTrigger id="stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPPORTUNITY_STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ownerId">Responsável</Label>
          <input type="hidden" name="ownerId" value={ownerId} />
          <Select
            value={ownerId || "none"}
            onValueChange={(value) => setOwnerId(value === "none" ? "" : value)}
          >
            <SelectTrigger id="ownerId">
              <SelectValue placeholder="Sem responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name ?? owner.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="leadId">Lead</Label>
          <input type="hidden" name="leadId" value={leadId} />
          <Select
            value={leadId || "none"}
            onValueChange={(value) => setLeadId(value === "none" ? "" : value)}
          >
            <SelectTrigger id="leadId">
              <SelectValue placeholder="Sem lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem lead</SelectItem>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente</Label>
          <input type="hidden" name="customerId" value={customerId} />
          <Select
            value={customerId || "none"}
            onValueChange={(value) =>
              setCustomerId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger id="customerId">
              <SelectValue placeholder="Sem cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Valor estimado (R$)</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            inputMode="decimal"
            defaultValue={moneyDefault(opportunity?.estimatedValue ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Probabilidade (%)</Label>
          <Input
            id="probability"
            name="probability"
            type="number"
            min={0}
            max={100}
            defaultValue={opportunity?.probability ?? 10}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedCloseDate">Previsão de fechamento</Label>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            defaultValue={toDateInputValue(opportunity?.expectedCloseDate)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={opportunity?.notes ?? ""}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar oportunidade"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
