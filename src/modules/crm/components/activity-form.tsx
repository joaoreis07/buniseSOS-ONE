"use client";

import { useActionState, useState } from "react";
import type { Activity, ActivityStatus, ActivityType } from "@prisma/client";
import {
  createActivityAction,
  updateActivityAction,
  type ActivityActionResult,
} from "@/modules/crm/actions/activity.actions";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  toDateTimeLocalValue,
} from "@/modules/crm/lib/activity-labels";
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

type ActivityFormProps = {
  mode: "create" | "edit";
  activity?: Activity;
  owners: Option[];
  customers: Array<{ id: string; name: string }>;
  leads: Array<{ id: string; name: string }>;
  opportunities: Array<{ id: string; name: string }>;
  defaults?: {
    customerId?: string;
    leadId?: string;
    opportunityId?: string;
  };
};

export function ActivityForm({
  mode,
  activity,
  owners,
  customers,
  leads,
  opportunities,
  defaults,
}: ActivityFormProps) {
  const action = mode === "create" ? createActivityAction : updateActivityAction;
  const [state, formAction, pending] = useActionState<
    ActivityActionResult | undefined,
    FormData
  >(action, undefined);

  const [type, setType] = useState<ActivityType>(activity?.type ?? "TASK");
  const [status, setStatus] = useState<ActivityStatus>(
    activity?.status ?? "PENDING",
  );
  const [ownerId, setOwnerId] = useState(activity?.ownerId ?? "");
  const [customerId, setCustomerId] = useState(
    activity?.customerId ?? defaults?.customerId ?? "",
  );
  const [leadId, setLeadId] = useState(
    activity?.leadId ?? defaults?.leadId ?? "",
  );
  const [opportunityId, setOpportunityId] = useState(
    activity?.opportunityId ?? defaults?.opportunityId ?? "",
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && activity ? (
        <input type="hidden" name="activityId" value={activity.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={activity?.title ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <input type="hidden" name="type" value={type} />
          <Select
            value={type}
            onValueChange={(value) => setType(value as ActivityType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
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
            onValueChange={(value) => setStatus(value as ActivityStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
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
          <Label htmlFor="dueAt">Data/hora</Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(activity?.dueAt)}
          />
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
              {customers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
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
              {leads.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="opportunityId">Oportunidade</Label>
          <input type="hidden" name="opportunityId" value={opportunityId} />
          <Select
            value={opportunityId || "none"}
            onValueChange={(value) =>
              setOpportunityId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger id="opportunityId">
              <SelectValue placeholder="Sem oportunidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem oportunidade</SelectItem>
              {opportunities.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={activity?.description ?? ""}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar atividade"
              : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
