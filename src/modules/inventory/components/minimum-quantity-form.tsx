"use client";

import { useActionState } from "react";
import {
  updateMinimumQuantityAction,
  type InventoryActionResult,
} from "@/modules/inventory/actions/inventory.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function MinimumQuantityForm({
  productId,
  minimumQuantity,
}: {
  productId: string;
  minimumQuantity: number;
}) {
  const [state, formAction, pending] = useActionState<
    InventoryActionResult | undefined,
    FormData
  >(updateMinimumQuantityAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="minimumQuantity">Estoque mínimo</Label>
          <Input
            id="minimumQuantity"
            name="minimumQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={minimumQuantity}
            className="w-32"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar mínimo"}
        </Button>
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Estoque mínimo atualizado.</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
