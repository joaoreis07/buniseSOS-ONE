"use client";

import { useActionState } from "react";
import {
  cancelSaleAction,
  type SaleActionResult,
} from "@/modules/sales/actions/sale.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const [state, formAction, pending] = useActionState<
    SaleActionResult | undefined,
    FormData
  >(cancelSaleAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Cancelar esta venda? O estoque dos produtos físicos será estornado.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="saleId" value={saleId} />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Venda cancelada.</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Cancelando..." : "Cancelar venda"}
      </Button>
    </form>
  );
}
