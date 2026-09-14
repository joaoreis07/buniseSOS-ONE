"use client";

import { useActionState } from "react";
import {
  openWhatsAppAction,
  cancelCommunicationAction,
  type CommunicationActionResult,
} from "@/modules/communications/actions/communication.actions";
import { WHATSAPP_MANUAL_DISCLAIMER } from "@/modules/communications/lib/labels";
import { Button } from "@/shared/ui/button";

export function OpenWhatsAppButton({
  communicationId,
  url,
}: {
  communicationId: string;
  url: string | null;
}) {
  const [state, action, pending] = useActionState(
    openWhatsAppAction,
    undefined as CommunicationActionResult | undefined,
  );

  return (
    <form
      action={action}
      onSubmit={() => {
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      <input type="hidden" name="communicationId" value={communicationId} />
      <Button type="submit" disabled={pending || !url}>
        {pending ? "Abrindo…" : "Abrir WhatsApp"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        {WHATSAPP_MANUAL_DISCLAIMER}
      </p>
      {state?.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export function CancelCommunicationButton({
  communicationId,
}: {
  communicationId: string;
}) {
  const [state, action, pending] = useActionState(
    cancelCommunicationAction,
    undefined as CommunicationActionResult | undefined,
  );
  return (
    <form action={action}>
      <input type="hidden" name="communicationId" value={communicationId} />
      <Button type="submit" variant="outline" disabled={pending}>
        Cancelar
      </Button>
      {state?.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
