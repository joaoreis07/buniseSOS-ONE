"use client";

import { useActionState } from "react";
import {
  deleteOpportunityAction,
  type OpportunityActionResult,
} from "@/modules/crm/actions/opportunity.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function DeleteOpportunityButton({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [state, formAction, pending] = useActionState<
    OpportunityActionResult | undefined,
    FormData
  >(deleteOpportunityAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir esta oportunidade? (soft delete)")) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />
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
