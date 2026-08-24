"use client";

import { useActionState, useState } from "react";
import type { Lead, LeadOrigin, LeadStatus } from "@prisma/client";
import {
  createLeadAction,
  updateLeadAction,
  type LeadActionResult,
} from "@/modules/crm/actions/lead.actions";
import {
  LEAD_ORIGIN_LABELS,
  LEAD_STATUS_LABELS,
} from "@/modules/crm/lib/lead-labels";
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

type OwnerOption = {
  id: string;
  name: string | null;
  email: string;
};

type LeadFormProps = {
  mode: "create" | "edit";
  lead?: Lead;
  owners: OwnerOption[];
};

function moneyDefault(value: Lead["estimatedValue"]): string {
  if (value == null) return "";
  return Number(value).toFixed(2);
}

export function LeadForm({ mode, lead, owners }: LeadFormProps) {
  const action = mode === "create" ? createLeadAction : updateLeadAction;
  const [state, formAction, pending] = useActionState<
    LeadActionResult | undefined,
    FormData
  >(action, undefined);

  const [origin, setOrigin] = useState<LeadOrigin>(lead?.origin ?? "OTHER");
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "NEW");
  const [ownerId, setOwnerId] = useState<string>(lead?.ownerId ?? "");

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && lead ? (
        <input type="hidden" name="leadId" value={lead.id} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Identificação
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" name="name" required defaultValue={lead?.name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Empresa</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={lead?.companyName ?? ""}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Contato
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={lead?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={lead?.whatsapp ?? ""}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Comercial
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin">Origem</Label>
          <input type="hidden" name="origin" value={origin} />
          <Select
            value={origin}
            onValueChange={(value) => setOrigin(value as LeadOrigin)}
          >
            <SelectTrigger id="origin">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_ORIGIN_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as LeadStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
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
          <Label htmlFor="estimatedValue">Valor estimado (R$)</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={moneyDefault(lead?.estimatedValue ?? null)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={lead?.notes ?? ""}
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
              ? "Criar lead"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
