"use client";

import { useActionState } from "react";
import {
  toggleTemplateAction,
  type CommunicationActionResult,
} from "@/modules/communications/actions/communication.actions";
import { Button } from "@/shared/ui/button";

export function ToggleTemplateButton({
  templateId,
  active,
}: {
  templateId: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(
    toggleTemplateAction,
    undefined as CommunicationActionResult | undefined,
  );
  return (
    <form action={action}>
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <Button type="submit" variant="outline" disabled={pending}>
        {active ? "Inativar" : "Ativar"}
      </Button>
      {state?.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
