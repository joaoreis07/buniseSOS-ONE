"use client";

import { useActionState } from "react";
import {
  deleteCustomerAction,
  type CustomerActionResult,
} from "@/modules/crm/actions/customer.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [state, formAction, pending] = useActionState<
    CustomerActionResult | undefined,
    FormData
  >(deleteCustomerAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir este cliente? (soft delete)")) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="customerId" value={customerId} />
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
