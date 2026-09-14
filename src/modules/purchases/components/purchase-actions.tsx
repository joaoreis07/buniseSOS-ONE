"use client";

import { useActionState } from "react";
import {
  cancelPurchaseAction,
  receivePurchaseAction,
  type PurchaseActionResult,
} from "@/modules/purchases/actions/purchase.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function ReceivePurchaseButton({ purchaseId }: { purchaseId: string }) {
  const [state, formAction, pending] = useActionState<
    PurchaseActionResult | undefined,
    FormData
  >(receivePurchaseAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Receber esta compra? O estoque dos produtos físicos será aumentado.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="purchaseId" value={purchaseId} />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Compra recebida.</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Recebendo..." : "Receber compra"}
      </Button>
    </form>
  );
}

export function CancelPurchaseButton({
  purchaseId,
  received,
}: {
  purchaseId: string;
  received: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    PurchaseActionResult | undefined,
    FormData
  >(cancelPurchaseAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const message = received
          ? "Cancelar esta compra recebida? O estoque será estornado se houver saldo."
          : "Cancelar este rascunho?";
        if (!window.confirm(message)) event.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="purchaseId" value={purchaseId} />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Compra cancelada.</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Cancelando..." : "Cancelar compra"}
      </Button>
    </form>
  );
}
