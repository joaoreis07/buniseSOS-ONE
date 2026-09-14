"use client";

import { useActionState } from "react";
import {
  recordManualCommunicationAction,
  type CommunicationActionResult,
} from "@/modules/communications/actions/communication.actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function RecordManualCommunicationForm({
  customerId,
  activityId,
}: {
  customerId: string;
  activityId?: string | null;
}) {
  const [state, action, pending] = useActionState(
    recordManualCommunicationAction,
    undefined as CommunicationActionResult | undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="activityId" value={activityId ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="channel">Canal</Label>
          <select
            id="channel"
            name="channel"
            defaultValue="WHATSAPP"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
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
            defaultValue="MANUAL"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            {Object.entries(COMMUNICATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="recipient">Destinatário</Label>
        <Input id="recipient" name="recipient" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">Mensagem</Label>
        <Textarea id="body" name="body" required />
      </div>
      {state?.ok ? (
        <p className="text-sm text-emerald-700">Comunicação registrada.</p>
      ) : null}
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Salvando…" : "Registrar comunicação"}
      </Button>
    </form>
  );
}
