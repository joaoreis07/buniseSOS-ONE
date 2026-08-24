"use client";

import { useActionState, useState } from "react";
import type { InventoryMovementType } from "@prisma/client";
import {
  registerMovementAction,
  type InventoryActionResult,
} from "@/modules/inventory/actions/inventory.actions";
import { INVENTORY_MOVEMENT_LABELS } from "@/modules/inventory/lib/inventory-labels";
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

export function MovementForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState<
    InventoryActionResult | undefined,
    FormData
  >(registerMovementAction, undefined);

  const [type, setType] = useState<InventoryMovementType>("ENTRY");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as InventoryMovementType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INVENTORY_MOVEMENT_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">
            {type === "ADJUSTMENT" ? "Quantidade (referência)" : "Quantidade *"}
          </Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            defaultValue="1"
          />
        </div>
        {type === "ADJUSTMENT" ? (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="targetQuantity">Quantidade final desejada *</Label>
            <Input
              id="targetQuantity"
              name="targetQuantity"
              type="number"
              min="0"
              step="1"
              required
            />
            <p className="text-xs text-muted-foreground">
              O ajuste define o saldo final. Use nova movimentação para
              corrigir erros — movimentações não são editáveis.
            </p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" name="reason" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>Movimentação registrada.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando..." : "Registrar movimentação"}
        </Button>
      </div>
    </form>
  );
}
