"use client";

import { useActionState } from "react";
import {
  deleteLeadAction,
  type LeadActionResult,
} from "@/modules/crm/actions/lead.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState<
    LeadActionResult | undefined,
    FormData
  >(deleteLeadAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir este lead? (soft delete)")) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="leadId" value={leadId} />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Excluindo..." : "Excluir"}
      </Button>
    </form>
  );
}
