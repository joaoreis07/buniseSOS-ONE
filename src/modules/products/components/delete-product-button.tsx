"use client";

import { useActionState } from "react";
import {
  deleteProductAction,
  type ProductActionResult,
} from "@/modules/products/actions/product.actions";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState<
    ProductActionResult | undefined,
    FormData
  >(deleteProductAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir este produto? (soft delete)")) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="productId" value={productId} />
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
